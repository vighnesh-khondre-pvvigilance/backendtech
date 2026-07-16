// services/S3.js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const IMAGE_BUCKET = process.env.S3_BUCKET_NAME_IMAGES;
console.log('🪣 IMAGE_BUCKET =', IMAGE_BUCKET);

const PDF_BUCKET = process.env.S3_PDF_BUCKET_NAME || 'solar-audit-reports';

export const MAX_PHOTOS_PER_REPORT = 20;

export function buildPhotoKey(reportId, photoId, fileName) {
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  return `reports/${reportId}/photos/${photoId}.${ext}`;
}

export async function getUploadPresignedUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: IMAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export async function getViewPresignedUrl(key) {
  const command = new GetObjectCommand({ Bucket: IMAGE_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deletePhotoObject(key) {
  const command = new DeleteObjectCommand({ Bucket: IMAGE_BUCKET, Key: key });
  return s3.send(command);
}

/**
 * Build the S3 key for a PDF.
 * The `timestamp` param must be supplied by the caller (/approve route) so that
 * the same key can be reused across /approve, /upload-pdf, and /approved-record.
 * Never call this function twice for the same report — pass the key through instead.
 */
export function buildPdfKey(reportId, reportNumber, timestamp) {
  const slug = (reportNumber || reportId).replace(/[^a-zA-Z0-9-_]/g, '_');
  const ts = timestamp || Date.now();  // fallback only — caller should always pass timestamp
  return `approved-reports/${reportId}/${slug}-${ts}.pdf`;
}

export async function getPdfUploadPresignedUrl(key) {
  const command = new PutObjectCommand({
    Bucket: PDF_BUCKET,
    Key: key,
    ContentType: 'application/pdf',
    ChecksumAlgorithm: undefined,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 300,
    unhoistableHeaders: new Set(),
  });
}

export async function getPdfViewPresignedUrl(key) {
  const command = new GetObjectCommand({ Bucket: PDF_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}