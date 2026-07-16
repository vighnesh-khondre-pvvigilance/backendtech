// routes/reports.js
import { Router } from 'express';
const router = Router();
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  saveReport, saveSection, getReport, getSections, listReports, deleteReport,
  getApprovedReport, saveApprovedRecord, listApprovedRecords, getApprovedRecord,
} from '../services/Dynamoservice.js';
import {
  buildPhotoKey, getUploadPresignedUrl, getViewPresignedUrl, deletePhotoObject,
  MAX_PHOTOS_PER_REPORT, buildPdfKey, getPdfViewPresignedUrl,
} from '../services/S3.js';

const upload = multer({ storage: multer.memoryStorage() });

// ─── POST /api/reports/:reportId/sections/:sectionIndex ──────────────────────
router.post('/reports/:reportId/sections/:sectionIndex', async (req, res) => {
  try {
    const { reportId, sectionIndex } = req.params;
    const sectionData = req.body;

    if (!reportId || sectionIndex === undefined) {
      return res.status(400).json({ error: 'reportId and sectionIndex are required' });
    }
    if (Array.isArray(sectionData?.photos) && sectionData.photos.length > MAX_PHOTOS_PER_REPORT) {
      return res.status(400).json({ error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos allowed per report` });
    }

    const saved = await saveSection(reportId, Number(sectionIndex), sectionData);
    res.status(200).json({ success: true, item: saved });
  } catch (err) {
    console.error('saveSection error:', err);
    res.status(500).json({ error: 'Failed to save section', details: err.message });
  }
});

// ─── POST /api/reports/:reportId ─────────────────────────────────────────────
router.post('/reports/:reportId/', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportData = req.body;

    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }
    if (Array.isArray(reportData?.photos) && reportData.photos.length > MAX_PHOTOS_PER_REPORT) {
      return res.status(400).json({ error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos allowed per report` });
    }

    const saved = await saveReport(reportId, reportData);
    res.status(200).json({ success: true, item: saved });
  } catch (err) {
    console.error('saveReport error:', err);
    res.status(500).json({ error: 'Failed to save report', details: err.message });
  }
});

// ─── GET /api/reports/:reportId ──────────────────────────────────────────────
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await getReport(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json(report);
  } catch (err) {
    console.error('getReport error:', err);
    res.status(500).json({ error: 'Failed to fetch report', details: err.message });
  }
});

// ─── GET /api/reports/:reportId/approved ─────────────────────────────────────
router.get('/reports/:reportId/approved', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await getApprovedReport(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Approved report not found' });
    }

    res.status(200).json(report);
  } catch (err) {
    console.error('getApprovedReport error:', err);
    res.status(500).json({ error: 'Failed to fetch approved report', details: err.message });
  }
});

// ─── GET /api/reports/:reportId/sections ─────────────────────────────────────
router.get('/reports/:reportId/sections', async (req, res) => {
  try {
    const { reportId } = req.params;
    const sections = await getSections(reportId);
    res.status(200).json(sections);
  } catch (err) {
    console.error('getSections error:', err);
    res.status(500).json({ error: 'Failed to fetch sections', details: err.message });
  }
});

// ─── GET /api/reports ────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const reports = await listReports(limit);
    res.status(200).json(reports);
  } catch (err) {
    console.error('listReports error:', err);
    res.status(500).json({ error: 'Failed to list reports', details: err.message });
  }
});

// ─── DELETE /api/reports/:reportId ───────────────────────────────────────────
router.delete('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    await deleteReport(reportId);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('deleteReport error:', err);
    res.status(500).json({ error: 'Failed to delete report', details: err.message });
  }
});

// ─── POST /api/reports/:reportId/photos/presign-upload ───────────────────────
router.post('/reports/:reportId/photos/presign-upload', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { fileName, contentType, currentPhotoCount } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    if (typeof currentPhotoCount === 'number' && currentPhotoCount >= MAX_PHOTOS_PER_REPORT) {
      return res.status(400).json({ error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos allowed per report` });
    }

    const photoId = uuidv4();
    const key = buildPhotoKey(reportId, photoId, fileName);
    const uploadUrl = await getUploadPresignedUrl(key, contentType);

    res.status(200).json({ photoId, key, uploadUrl });
  } catch (err) {
    console.error('presign-upload error:', err);
    res.status(500).json({ error: 'Failed to generate upload URL', details: err.message });
  }
});

// ─── POST /api/reports/:reportId/photos/view-urls ────────────────────────────
router.post('/reports/:reportId/photos/view-urls', async (req, res) => {
  try {
    const { keys } = req.body;
    console.log('📦 [view-urls] keys received:', keys);

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(200).json({});
    }

    const entries = await Promise.all(
      keys.map(async (key) => {
        const url = await getViewPresignedUrl(key);
        return [key, url];
      })
    );

    const urlMap = Object.fromEntries(entries);
    res.status(200).json(urlMap);
  } catch (err) {
    console.error('view-urls error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/reports/:reportId/photos ────────────────────────────────────
router.delete('/reports/:reportId/photos', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'key is required' });
    }

    await deletePhotoObject(key);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('deletePhoto error:', err);
    res.status(500).json({ error: 'Failed to delete photo', details: err.message });
  }
});

// ─── PATCH /api/reports/:reportId/submit ─────────────────────────────────────
router.patch('/reports/:reportId/submit', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await getReport(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const updated = await saveReport(reportId, { ...report, stage: 'pending_review' });
    res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error('submit error:', err);
    res.status(500).json({ error: 'Failed to submit report', details: err.message });
  }
});

// ─── PATCH /api/reports/:reportId ────────────────────────────────────────────
router.patch('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportData = req.body;

    const updated = await saveReport(reportId, reportData);
    res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error('patchReport error:', err);
    res.status(500).json({ error: 'Failed to update report', details: err.message });
  }
});

// ─── PATCH /api/reports/:reportId/approve ────────────────────────────────────
// Stamps pdfKey ONCE with a single Date.now() and returns it to the frontend.
// The frontend uses this exact key for both S3 upload and DynamoDB record.
router.patch('/reports/:reportId/approve', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { approvedBy, approvedAt, reportNumber } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }

    const report = await getReport(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const now = approvedAt || new Date().toISOString();

    await saveReport(reportId, {
      ...report,
      stage: 'approved',
      approvalInfo: { approvedBy, approvedAt: now },
    });

    // ✅ Stamp timestamp once here — this is the single source of truth for the key
    const pdfTimestamp = Date.now();
    const pdfKey = buildPdfKey(
      reportId,
      reportNumber || report.projectInfo?.reportNumber,
      pdfTimestamp,  // passed in so buildPdfKey doesn't call Date.now() again
    );

    res.status(200).json({ success: true, pdfKey });

  } catch (err) {
    console.error('approve error:', err);
    res.status(500).json({ error: 'Failed to approve report', details: err.message });
  }
});

// ─── POST /api/reports/:reportId/upload-pdf ──────────────────────────────────
// Receives PDF blob + the canonical pdfKey from the frontend (via query param).
// Does NOT call buildPdfKey — that would generate a new timestamp and break the key.
router.post('/reports/:reportId/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const pdfKey = req.query.pdfKey;  // ✅ use exact key from /approve, not reportNumber

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file received' });
    }
    if (!pdfKey) {
      return res.status(400).json({ error: 'pdfKey query param is required' });
    }

    const s3Direct = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    await s3Direct.send(new PutObjectCommand({
      Bucket: process.env.S3_PDF_BUCKET_NAME || 'solar-audit-reports',
      Key: pdfKey,  // ✅ exact same key — no new Date.now()
      Body: req.file.buffer,
      ContentType: 'application/pdf',
    }));

    const pdfUrl = `https://${process.env.S3_PDF_BUCKET_NAME || 'solar-audit-reports'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${pdfKey}`;
    console.log('✅ PDF uploaded to S3:', pdfUrl);

    res.status(200).json({ success: true, pdfKey, pdfUrl });

  } catch (err) {
    console.error('upload-pdf error:', err);
    res.status(500).json({ error: 'Failed to upload PDF', details: err.message });
  }
});

// ─── POST /api/reports/:reportId/approved-record ─────────────────────────────
router.post('/reports/:reportId/approved-record', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reportNumber, clientName, approvedBy, approvedAt, pdfKey } = req.body;

    if (!approvedBy || !pdfKey) {
      return res.status(400).json({ error: 'approvedBy and pdfKey are required' });
    }

    const pdfUrl = `https://${process.env.S3_PDF_BUCKET_NAME || 'solar-audit-reports'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${pdfKey}`;

    const record = await saveApprovedRecord(reportId, {
      reportNumber, clientName, approvedBy, approvedAt, pdfUrl, pdfKey,
    });

    res.status(200).json({ success: true, record, pdfUrl });

  } catch (err) {
    console.error('approved-record error:', err);
    res.status(500).json({ error: 'Failed to save approved record', details: err.message });
  }
});

// ─── GET /api/approved-reports ────────────────────────────────────────────────
router.get('/approved-reports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const records = await listApprovedRecords(limit);
    res.status(200).json(records);
  } catch (err) {
    console.error('listApprovedRecords error:', err);
    res.status(500).json({ error: 'Failed to list approved reports', details: err.message });
  }
});

// ─── GET /api/approved-reports/:reportId ─────────────────────────────────────
router.get('/approved-reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const record = await getApprovedRecord(reportId);
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(record);
  } catch (err) {
    console.error('getApprovedRecord error:', err);
    res.status(500).json({ error: 'Failed to fetch approved record', details: err.message });
  }
});

// ─── GET /api/approved-reports/:reportId/pdf-url ─────────────────────────────
router.get('/approved-reports/:reportId/pdf-url', async (req, res) => {
  try {
    const { reportId } = req.params;
    const record = await getApprovedRecord(reportId);
    if (!record) return res.status(404).json({ error: 'Not found' });

    const viewUrl = await getPdfViewPresignedUrl(record.pdfKey);
    res.status(200).json({ viewUrl });
  } catch (err) {
    console.error('pdf-url error:', err);
    res.status(500).json({ error: 'Failed to generate PDF view URL', details: err.message });
  }
});

// ─── PATCH /api/reports/:reportId/reject ─────────────────────────────────────
router.patch('/reports/:reportId/reject', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { rejectionReason } = req.body;

    const report = await getReport(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const updated = await saveReport(reportId, {
      ...report,
      stage: 'draft',
      approvalInfo: { ...report.approvalInfo, rejectionReason },
    });
    res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error('reject error:', err);
    res.status(500).json({ error: 'Failed to reject report', details: err.message });
  }
});

// ─── PATCH /api/reports/:reportId/reviewer ───────────────────────────────────
// Saves the selected reviewer name immediately when the "Reviewing as"
// dropdown changes. Stores as `reviewedBy` inside approvalInfo.
router.patch('/reports/:reportId/reviewer', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reviewedBy } = req.body;

    if (!reviewedBy) return res.status(400).json({ error: 'reviewedBy is required' });

    const report = await getReport(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    await saveReport(reportId, {
      ...report,
      approvalInfo: { ...(report.approvalInfo || {}), reviewedBy },
    });

    res.status(200).json({ success: true, reviewedBy });
  } catch (err) {
    console.error('reviewer error:', err);
    res.status(500).json({ error: 'Failed to update reviewer', details: err.message });
  }
});

// ─── PATCH /api/reports/:reportId/finalize ───────────────────────────────────
router.patch('/reports/:reportId/finalize', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportData = req.body;

    const updated = await saveReport(reportId, { ...reportData, stage: 'finalized' });
    res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error('finalize error:', err);
    res.status(500).json({ error: 'Failed to finalize report', details: err.message });
  }
});

export default router;