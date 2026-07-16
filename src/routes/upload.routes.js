import { Router } from "express";

const router = Router();

import { generatePresignedUrl } from "../controllers/upload.controller.js";

router.post(
  "/presigned-url",
  generatePresignedUrl
  
);

export default router;