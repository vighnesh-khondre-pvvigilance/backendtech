import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { configureDynamoDB, getDynamoDBClient } from "../db/index.js";

configureDynamoDB();

const dynamoDbClient = getDynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME = "NotificationTokens-dev";

export async function getNotificationToken(techId) {
  if (!techId) {
    throw new Error("userId is required to fetch notification token");
  }

  const response = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId: techId,
      },
    })
  );
console.log("Notification Token Response:", response);
  return response.Item || null;
}