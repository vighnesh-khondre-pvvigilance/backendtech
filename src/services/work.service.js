const dynamo =
  require("../config/dynamodb");

const {
  QueryCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

exports.getWorksByTechnician =
  async (technicianId) => {
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
      await dynamo.send(command);

    return result.Items || [];
  };

exports.getWork = async (
  taskId
) => {
  const command =
    new GetCommand({
      TableName:
        process.env.WORKS_TABLE,

      Key: {
        taskId,
      },
    });

  const result =
    await dynamo.send(command);

  return result.Item;
};