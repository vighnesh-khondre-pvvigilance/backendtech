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

  const item = {
  VisitID: visitId,

  PlantID: visitData.PlantID,
  ClientID: visitData.ClientID,

  workDoneBy: visitData.workDoneBy,

  visitDate: visitData.visitDate,

  inverterStatus: visitData.inverterStatus,
  inverterRemarks: visitData.inverterRemarks,

  importReading: visitData.importReading,
  exportReading: visitData.exportReading,
  netReading: visitData.netReading,
  generationReading: visitData.generationReading,

  extraRemarks: visitData.extraRemarks,

  iAmAgreeWithRules: visitData.iAmAgreeWithRules,

  safetyPhotourl: visitData.safetyPhotourl,

  isCleaningCycle: visitData.isCleaningCycle,

  clientSignaturePhotourl:
    visitData.clientSignaturePhotourl,

  extraOtherPhotourl:
    visitData.extraOtherPhotourl,

  inverterPhotourl:
    visitData.inverterPhotourl,

  importReadingPhotoUrl:
    visitData.importReadingPhotoUrl,

  exportReadingPhotoUrl:
    visitData.exportReadingPhotoUrl,

  netReadingPhotoUrl:
    visitData.netReadingPhotoUrl,

  generationReadingPhotoUrl:
    visitData.generationReadingPhotoUrl,

  beforeCleaningPhotourl:
    visitData.beforeCleaningPhotourl,

  afterCleaningPhotourl:
    visitData.afterCleaningPhotourl,

  status: "Completed",

  submittedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
          VisitID: visitId,
        },
      })
    );

  return result.Item;
};