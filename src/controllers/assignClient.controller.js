import {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";


import { configureDynamoDB, getDynamoDBClient } from "../db/index.js";
import { getNotificationToken } from "../utils/expoNotification.js";
import notificationService from "../services/notificatioExpo.service.js";

configureDynamoDB();

const dynamoDbClient = getDynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

const CLIENT_TABLE = "Clients-dev";
const NOTIFICATION_TABLE = "NotificationTokens-dev"; // same existing table

export const assignClientToTechnician = async (req, res) => {
  try {
    const { clientId, technicianId } = req.body;

    if (!clientId || !technicianId) {
      return res.status(400).json({
        success: false,
        message: "clientId and technicianId are required",
      });
    }

    // Update Client Assignment
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: CLIENT_TABLE,
        Key: { clientId },
        UpdateExpression:
          "SET assignedTechnicianId = :techId, assignedAt = :assignedAt",
        ExpressionAttributeValues: {
          ":techId": technicianId,
          ":assignedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    const updatedClient = result.Attributes;

    const notificationPayload = {
      title: "New Client Assigned",
      body: `${updatedClient?.clientName || "A client"} has been assigned to you`,
      data: {
        type: "CLIENT_ASSIGNED",
        screen: "AssignedClients",
        clientId,
        technicianId,
      },
    };

    const notificationId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // IMPORTANT: use a composite key for the log item so it never collides
    // with the technician's actual token item (userId: technicianId)
    const logKey = `${technicianId}#${notificationId}`;

    // Persist notification record under composite key
    await dynamoDb.send(
      new PutCommand({
        TableName: NOTIFICATION_TABLE,
        Item: {
          userId: logKey, // NOT technicianId directly
          technicianId,   // keep the real technician id as its own attribute
          notificationId,
          eventType: "CLIENT_ASSIGNED",
          title: notificationPayload.title,
          body: notificationPayload.body,
          data: notificationPayload.data,
          status: "CREATED",
          createdAt,
        },
      })
    );

    // Send Push Notification
    let ticketStatus = "FAILED";
    let expoTicket = null;

    try {
      // This looks up userId: technicianId exactly -> gets the real token, untouched
      const tokenData = await getNotificationToken(technicianId);

      if (tokenData?.expoPushToken) {
        const tickets = await notificationService.sendNotification({
          expoPushToken: tokenData.expoPushToken,
          title: notificationPayload.title,
          body: notificationPayload.body,
          data: notificationPayload.data,
        });

        expoTicket = tickets?.[0] || null;
        ticketStatus = expoTicket?.status === "ok" ? "SENT" : "FAILED";

        console.log(`Notification sent to technician ${technicianId}`);
      } else {
        console.log(`No Expo token found for technician ${technicianId}`);
      }
    } catch (notificationError) {
      console.error("Notification Error:", notificationError);
    }

    // Update log item with delivery status (same composite key)
    await dynamoDb.send(
      new PutCommand({
        TableName: NOTIFICATION_TABLE,
        Item: {
          userId: logKey,
          technicianId,
          notificationId,
          eventType: "CLIENT_ASSIGNED",
          title: notificationPayload.title,
          body: notificationPayload.body,
          data: notificationPayload.data,
          status: ticketStatus,
          expoTicket,
          createdAt,
          updatedAt: new Date().toISOString(),
        },
      })
    );

    return res.status(200).json({
      success: true,
      message: "Client assigned successfully",
      data: updatedClient,
      notificationId,
    });
  } catch (error) {
    console.error("assignClientToTechnician:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const removeNotificationToken = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    await dynamoDb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId },
      })
    );

    return res.status(200).json({
      success: true,
      message: "Notification token removed",
    });
  } catch (error) {
    console.error("removeNotificationToken error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};