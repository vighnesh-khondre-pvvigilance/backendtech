import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import dynamoDb from "../config/dynamodb.js";
import { getNotificationToken } from "../utils/expoNotification.js";
import notificationService from "../services/notificatioExpo.service.js";

const NOTIFICATION_TABLE = "NotificationTokens-dev";
const TechnicianClientMappingTable = "TechnicianClientMapping-dev"; // confirm real table name

export const assignClientsToTechnician = async (req, res) => {
  try {
    const { techId, clientIds, adminId } = req.body;

    if (!techId || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "techId and clientIds (non-empty array) are required", 
      });
    }

    const existingAssignments = [];

    for (const clientId of clientIds) {
      const existing = await dynamoDb.send(
        new QueryCommand({
          TableName: TechnicianClientMappingTable,
          KeyConditionExpression: "techId = :tid AND clientId = :cid",
          ExpressionAttributeValues: {
            ":tid": techId,
            ":cid": clientId,
          },
        })
      );

      if (existing.Items && existing.Items.length > 0) {
        existingAssignments.push(clientId);
      }
    }

    const newClientIds = clientIds.filter(
      (id) => !existingAssignments.includes(id)
    );

    if (newClientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All selected clients are already assigned to this technician",
      });
    }

    // Assign clients to technician
    const nowIso = new Date().toISOString();

    for (const clientId of newClientIds) {
      await dynamoDb.send(
        new PutCommand({
          TableName: TechnicianClientMappingTable,
          Item: {
            techId,
            clientId,
            assignedByAdminId: adminId,
            assignedAt: nowIso,
            status: "active",
          },
        })
      );
    }

    // ---- Notification logic ----
    const notificationPayload = {
      title: "New Client Assigned",
      body:
        newClientIds.length === 1
          ? "A new client has been assigned to you"
          : `${newClientIds.length} new clients have been assigned to you`,
      data: {
        type: "CLIENT_ASSIGNED",
        screen: "AssignedClients",
        clientIds: newClientIds,
        techId,
      },
    };

    const notificationId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Composite key so this log entry never collides with the tech's token record
    const logKey = `${techId}#${notificationId}`;

    await dynamoDb.send(
      new PutCommand({
        TableName: NOTIFICATION_TABLE,
        Item: {
          userId: logKey,
          technicianId: techId,
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

    let ticketStatus = "FAILED";
    let expoTicket = null;

    try {
      const tokenData = await getNotificationToken(techId);

      if (tokenData?.expoPushToken) {
        const tickets = await notificationService.sendNotification({
          expoPushToken: tokenData.expoPushToken,
          title: notificationPayload.title,
          body: notificationPayload.body,
          data: notificationPayload.data,
        });

        expoTicket = tickets?.[0] || null;
        ticketStatus = expoTicket?.status === "ok" ? "SENT" : "FAILED";

        console.log(`Notification sent to technician ${techId}`);
      } else {
        console.log(`No Expo token found for technician ${techId}`);
      }
    } catch (notificationError) {
      console.error("Notification Error:", notificationError);
    }

    await dynamoDb.send(
      new PutCommand({
        TableName: NOTIFICATION_TABLE,
        Item: {
          userId: logKey,
          technicianId: techId,
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
    // ---- End notification logic ----

    return res.status(200).json({
      success: true,
      message: `Assigned ${newClientIds.length} client(s) successfully`,
      data: {
        techId,
        assignedClients: newClientIds,
        skippedAlreadyAssigned: existingAssignments,
        notificationId,
      },
    });
  } catch (error) {
    console.error("Error in assignClientsToTechnician:", error);
    return res.status(500).json({
      success: false,
      message: "Error assigning clients",
      errors: [error.message],
    });
  }
};


export const saveNotificationToken = async (req, res) => {
  try {
    const { userId, expoPushToken, devicePlatform } = req.body;

    if (!userId || !expoPushToken) {
      return res.status(400).json({
        success: false,
        message: "userId and expoPushToken are required",
      });
    }

    await dynamoDb.send(
      new PutCommand({
        TableName: NOTIFICATION_TABLE,
        Item: {
          userId, // plain techId/userId — matches what getNotificationToken(techId) queries by
          expoPushToken,
          devicePlatform: devicePlatform || "unknown",
          updatedAt: new Date().toISOString(),
        },
      })
    );

    return res.status(200).json({
      success: true,
      message: "Push token saved",
    });
  } catch (error) {
    console.error("saveNotificationToken error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
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
        TableName: NOTIFICATION_TABLE,
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