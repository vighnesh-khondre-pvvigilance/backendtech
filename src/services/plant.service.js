const dynamo = require("../config/dynamodb");

const {
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const TABLE =
  process.env.PLANTS_TABLE;

exports.getPlantsByClient =
  async (clientId) => {
    const result =
      await dynamo.send(
        new QueryCommand({
          TableName: TABLE,

          IndexName:
            "clientId-index",

          KeyConditionExpression:
            "clientId = :clientId",

          ExpressionAttributeValues:
            {
              ":clientId":
                clientId,
            },
        })
      );

    return result.Items || [];
  };

exports.getPlantById =
  async (plantId) => {
    const result =
      await dynamo.send(
        new QueryCommand({
          TableName: TABLE,

          KeyConditionExpression:
            "plantId = :plantId",

          ExpressionAttributeValues:
            {
              ":plantId":
                plantId,
            },
        })
      );

    return result.Items?.[0] || null;
  };