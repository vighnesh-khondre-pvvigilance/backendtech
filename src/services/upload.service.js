const s3 = require("../config/s3");

const {
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

exports.generateUploadUrl = async ({
  plantId,
  fileName,
  type,
}) => {
  const extension =
    fileName.split(".").pop() || "jpg";

  const timestamp =
    Date.now();

  const key =
    `photos1/${type}/${plantId}/${timestamp}.${extension}`;

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
};