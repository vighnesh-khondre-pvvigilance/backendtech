import s3 from "../config/s3";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function generateUploadUrl({
  plantId,
  fileName,
  type,
}) {
  const extension =
    fileName.split(".").pop() || "jpg";

  const timestamp =
    Date.now();

  const key =
    `photos/${type}/${plantId}/${timestamp}.${extension}`;

  const command =
    new PutObjectCommand({
      Bucket:
        process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: "image/jpeg",
    });

  const uploadUrl =
    await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 600,
      }
    );

  return {
    uploadUrl,
    key,
  };
}