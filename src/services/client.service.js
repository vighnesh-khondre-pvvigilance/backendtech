const dynamo = require("../config/dynamodb");
const {
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const TABLE =
  process.env.CLIENTS_TABLE;

exports.getClients =
  async () => {
    const result =
      await dynamo.send(
        new ScanCommand({
          TableName: TABLE,
        })
      );

    return result.Items || [];
  };