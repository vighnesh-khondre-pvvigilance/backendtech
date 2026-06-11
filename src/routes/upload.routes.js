const express = require("express");

const router = express.Router();

const uploadController =
  require(
    "../controllers/upload.controller"
  );

router.post(
  "/presigned-url",
  uploadController.generatePresignedUrl
  
);

module.exports = router;