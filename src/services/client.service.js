import { send } from "../config/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const TABLE =
  process.env.CLIENTS_TABLE;

export async function   getClients() {
    const result =
      await send(
        new ScanCommand({
          TableName: TABLE,
        })
      );

    return result.Items || [];
  }