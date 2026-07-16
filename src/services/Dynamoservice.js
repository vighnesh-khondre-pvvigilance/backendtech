// services/Dynamoservice.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.DYNAMODB_TABLE_NAME || 'solar_audit_reports_draft';

// ✅ Client is created lazily (on first use) so dotenv has already run by then
let _docClient = null;

function getClient() {
  if (_docClient) return _docClient;

  const accessKeyId     = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region          = process.env.AWS_REGION || 'ap-south-1';

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      `AWS credentials missing at runtime.\n` +
      `  AWS_ACCESS_KEY_ID: ${accessKeyId ? '✅' : '❌ MISSING'}\n` +
      `  AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? '✅' : '❌ MISSING'}`
    );
  }

  const client = new DynamoDBClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  _docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  console.log(`✅ DynamoDB client created — region: ${region}, table: ${TABLE}`);
  return _docClient;
}

// ─── Save a section snapshot ──────────────────────────────────────────────────
export async function saveSection(reportId, sectionIndex, sectionData) {
  const item = {
    reportId,
    sk: `SECTION#${sectionIndex}`,
    sectionIndex,
    data: sectionData,
    savedAt: new Date().toISOString(),
  };
  await getClient().send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

// ─── Save / overwrite the full report ────────────────────────────────────────
export async function saveReport(reportId, reportData) {
  const item = {
    ...reportData,       // ✅ spread first so reportId/sk always win
    reportId,
    sk: 'REPORT',
    updatedAt: new Date().toISOString(),
    createdAt: reportData?.createdAt || new Date().toISOString(),
  };
  await getClient().send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

// ─── Get a full report by ID ──────────────────────────────────────────────────
export async function getReport(reportId) {
  const result = await getClient().send(
    new GetCommand({ TableName: TABLE, Key: { reportId, sk: 'REPORT' } })
  );
  return result.Item || null;
}

// ─── Get an approved report by ID ────────────────────────────────────────────
// Identical fetch to getReport but throws if the stage is not 'approved',
// so callers that specifically need an approved record get an explicit error
// instead of silently working on a draft.
export async function getApprovedReport(reportId) {
  const item = await getReport(reportId);
  if (!item) return null;
  if (item.stage !== 'approved') {
    throw new Error(`Report ${reportId} is not approved (current stage: ${item.stage})`);
  }
  return item;
}

// ─── Get all section snapshots for a report ───────────────────────────────────
export async function getSections(reportId) {
  const result = await getClient().send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'reportId = :id AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':id': reportId, ':prefix': 'SECTION#' },
    })
  );
  return result.Items || [];
}

// ─── List ALL reports (with optional stage filter) ────────────────────────────
// Pass stage as a string ('draft', 'pending_review', 'approved', 'rejected')
// or an array of stages to filter by multiple values.
// Omit stage to return everything.
export async function listReports(stage = null, limit = 50) {
  const params = {
    TableName: TABLE,
    FilterExpression: 'sk = :sk',
    ExpressionAttributeValues: { ':sk': 'REPORT' },
    Limit: limit,
  };

  if (stage) {
    const stages = Array.isArray(stage) ? stage : [stage];
    // Build a dynamic IN-clause using expression attribute values
    const stageVals = stages.reduce((acc, s, i) => {
      acc[`:stage${i}`] = s;
      return acc;
    }, {});
    params.FilterExpression += ` AND stage IN (${Object.keys(stageVals).join(', ')})`;
    Object.assign(params.ExpressionAttributeValues, stageVals);
  }

  const result = await getClient().send(new ScanCommand(params));
  return (result.Items || []).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

// ─── List draft + pending_review reports ──────────────────────────────────────
export async function listDraftReports() {
  return listReports(['draft', 'pending_review']);
}

// ─── List approved reports ────────────────────────────────────────────────────
export async function listApprovedReports() {
  return listReports('approved');
}

// ─── Low-level stage updater (shared by the workflow helpers below) ───────────
async function updateReportStage(reportId, stage, extraFields = {}) {
  const ExpressionAttributeNames  = { '#stage': 'stage', '#updatedAt': 'updatedAt' };
  const ExpressionAttributeValues = {
    ':stage':     stage,
    ':updatedAt': new Date().toISOString(),
  };

  // Merge any extra fields (approvalInfo, rejectionReason, etc.)
  const extraClauses = Object.entries(extraFields).map(([k, v]) => {
    ExpressionAttributeNames[`#${k}`]  = k;
    ExpressionAttributeValues[`:${k}`] = v;
    return `#${k} = :${k}`;
  });

  const setClause = ['#stage = :stage', '#updatedAt = :updatedAt', ...extraClauses].join(', ');

  await getClient().send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { reportId, sk: 'REPORT' },
      UpdateExpression: `SET ${setClause}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    })
  );
}

// ─── Submit a draft for review  (draft → pending_review) ─────────────────────
export async function submitForReview(reportId) {
  await updateReportStage(reportId, 'pending_review');
}

// ─── Approve a report  (pending_review → approved) ───────────────────────────
export async function approveReport(reportId, approvedBy) {
  await updateReportStage(reportId, 'approved', {
    approvalInfo: {
      approvedBy,
      approvedAt: new Date().toISOString(),
    },
  });
}

// ─── Reject a report  (pending_review → rejected / back to draft) ─────────────
// Sets stage back to 'draft' so the technician can resubmit after fixing issues.
export async function rejectReport(reportId, rejectionReason) {
  await updateReportStage(reportId, 'draft', {
    approvalInfo: { rejectionReason },
  });
}

// ─── Finalize an approved report to the permanent store ───────────────────────
// Overwrites the full record (with savedAt timestamp) after final approval.
export async function finalizeReport(reportId, reportData) {
  return saveReport(reportId, {
    ...reportData,
    stage:   'approved',
    savedAt: new Date().toISOString(),
  });
}

// ─── Partial update (reviewer inline edits) ───────────────────────────────────
// Merges supplied fields into the existing record without touching stage.
export async function patchReport(reportId, fields) {
  if (!fields || Object.keys(fields).length === 0) return;

  const ExpressionAttributeNames  = { '#updatedAt': 'updatedAt' };
  const ExpressionAttributeValues = { ':updatedAt': new Date().toISOString() };

  const setClauses = ['#updatedAt = :updatedAt'];

  Object.entries(fields).forEach(([k, v]) => {
    ExpressionAttributeNames[`#${k}`]  = k;
    ExpressionAttributeValues[`:${k}`] = v;
    setClauses.push(`#${k} = :${k}`);
  });

  await getClient().send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { reportId, sk: 'REPORT' },
      UpdateExpression: `SET ${setClauses.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    })
  );
}

// ─── Delete a report and all its sections ─────────────────────────────────────
export async function deleteReport(reportId) {
  await getClient().send(
    new DeleteCommand({ TableName: TABLE, Key: { reportId, sk: 'REPORT' } })
  );
  const sections = await getSections(reportId);
  for (const section of sections) {
    await getClient().send(
      new DeleteCommand({ TableName: TABLE, Key: { reportId, sk: section.sk } })
    );
  }
}

// ─── Approved reports table (audit_report_approved) ───────────────────────────

const APPROVED_TABLE = process.env.DYNAMODB_APPROVED_TABLE_NAME || 'audit_report_approved';

// Lazily create a second client pointed at the approved table.
// Reuses the same credentials/region as the draft client.
function getApprovedClient() {
  return getClient(); // same client, different table name
}

// ─── Save a record to the approved reports table ──────────────────────────────
export async function saveApprovedRecord(reportId, {
  reportNumber,
  clientName,
  approvedBy,
  approvedAt,
  pdfUrl,
  pdfKey,
}) {
  const item = {
    reportId,
    sk: 'APPROVED',
    reportNumber: reportNumber || reportId,
    clientName:   clientName  || '',
    approvedBy,
    approvedAt,
    pdfUrl,
    pdfKey,
    savedAt: new Date().toISOString(),
  };
  await getApprovedClient().send(
    new PutCommand({ TableName: APPROVED_TABLE, Item: item })
  );
  return item;
}

// ─── List all approved records ────────────────────────────────────────────────
// export async function listApprovedRecords(limit = 100) {
//   const result = await getApprovedClient().send(
//     new ScanCommand({
//       TableName: APPROVED_TABLE,
//       FilterExpression: 'sk = :sk',
//       ExpressionAttributeValues: { ':sk': 'APPROVED' },
//       Limit: limit,
//     })
//   );
//   return (result.Items || []).sort(
//     (a, b) => new Date(b.approvedAt) - new Date(a.approvedAt)
//   );
// }

// ─── Get a single approved record ────────────────────────────────────────────
export async function getApprovedRecord(reportId) {
  const result = await getClient().send(
    new GetCommand({ TableName: APPROVED_TABLE, Key: { reportId, sk: 'APPROVED' } })
  );
  return result.Item || null;
}



// ─── Approved reports table ───────────────────────────────────────────────────

// export async function saveApprovedRecord(reportId, {
//   reportNumber, clientName, approvedBy, approvedAt, pdfUrl, pdfKey,
// }) {
//   const item = {
//     reportId,
//     sk: 'APPROVED',
//     reportNumber: reportNumber || reportId,
//     clientName:   clientName  || '',
//     approvedBy,
//     approvedAt,
//     pdfUrl,
//     pdfKey,
//     savedAt: new Date().toISOString(),
//   };
//   await getClient().send(new PutCommand({ TableName: APPROVED_TABLE, Item: item }));
//   return item;
// }

export async function listApprovedRecords(limit = 100) {
  const result = await getClient().send(
    new ScanCommand({
      TableName: APPROVED_TABLE,
      FilterExpression: 'sk = :sk',
      ExpressionAttributeValues: { ':sk': 'APPROVED' },
      Limit: limit,
    })
  );
  return (result.Items || []).sort(
    (a, b) => new Date(b.approvedAt) - new Date(a.approvedAt)
  );
}


// export async function getApprovedRecord(reportId) {
//   const result = await getClient().send(
//     new GetCommand({ TableName: APPROVED_TABLE, Key: { reportId, sk: 'APPROVED' } })
//   );
//   return result.Item || null;
// }