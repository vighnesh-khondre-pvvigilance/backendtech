// src/utils/expoNotification.js
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDb from "../config/dynamodb.js";

const TABLE_NAME = "NotificationTokens-dev";

export async function getNotificationToken(techId) {
  if (!techId) {
    throw new Error("userId is required to fetch notification token");
  }

  const response = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId: techId },
    })
  );

  return response.Item || null;
}