const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

function configured() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_REGION);
}

function client() {
  if (!configured()) throw new Error('File storage is not configured. Set S3_BUCKET and S3_REGION.');
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  });
}

function safeExtension(filename) {
  return path.extname(filename || '').replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12);
}

async function createUploadUrl({ userId, filename, mimeType }) {
  const key = `clients/${userId}/${Date.now()}-${crypto.randomUUID()}${safeExtension(filename)}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: mimeType || 'application/octet-stream'
  });
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn: 900 });
  return { key, uploadUrl };
}

async function createDownloadUrl(storageKey, filename) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: storageKey,
    ResponseContentDisposition: `inline; filename="${String(filename || 'file').replace(/["\\]/g, '')}"`
  });
  return getSignedUrl(client(), command, { expiresIn: 300 });
}

async function deleteObject(storageKey) {
  return client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: storageKey }));
}

module.exports = { configured, createUploadUrl, createDownloadUrl, deleteObject };
