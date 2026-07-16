import dynamo from "../config/dynamodb.js";
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

export async function   getWorksByTechnician(technicianId) {
    const command =
      new QueryCommand({
        TableName:
          process.env.WORKS_TABLE,

        IndexName:
          "TechnicianIndex",

        KeyConditionExpression:
          "technicianId = :techId",

        ExpressionAttributeValues: {
          ":techId": technicianId,
        },
      });

    const result =
      await dynamo(command);

    return result.Items || [];
  }

export async function getWork(
  taskId
) {
  const command =
    new GetCommand({
      TableName:
        process.env.WORKS_TABLE,

      Key: {
        taskId,
      },
    });

  const result =
    await dynamo(command);

  return result.Item;
}