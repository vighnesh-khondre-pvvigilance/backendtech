const dynamo = require("../config/dynamodb");

const {
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { v4: uuid } = require("uuid");

/**
 * Final Visit Submission
 */
exports.createVisit = async (
  visitData
) => {
  console.log("VISITS TABLE =", process.env.VISITS_TABLE);
  const visitId = uuid();
  if(!plantId || !visitId){
    return new Error("VisitId and plnat Id required");
  }
  const item = {
    visitId,

    plantId:
      visitData.plantId,

    taskId:
      visitData.taskId,

    technicianId:
      visitData.technicianId,

    approvalConfirmed:
      visitData.approvalConfirmed,

    safety:
      visitData.safety || {
        verified: false,
        image: null,
      },

    visitForm:
      visitData.visitForm || {},

    uploads:
      visitData.uploads || {},

    cleaning:
      visitData.cleaning || {
        required: false,
        done: false,
        before: [],
        after: [],
      },

    status: "Completed",

    submittedAt:
      new Date().toISOString(),

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };
  console.log("ITEM TO SAVE");
  console.log(JSON.stringify(item, null, 2));


  await dynamo.send(
    new PutCommand({
      TableName:
        process.env.VISITS_TABLE,
      Item: item,
    })

  );
  console.log("DYNAMODB SAVE SUCCESS");
  return item;
};

/**
 * Get Visit By ID
 */
exports.getVisit = async (
  visitId
) => {
  const result =
    await dynamo.send(
      new GetCommand({
        TableName:
          process.env.VISITS_TABLE,

        Key: {
          visitId,
        },
      })
    );

  return result.Item;
};