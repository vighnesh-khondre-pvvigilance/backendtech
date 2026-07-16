import { Router } from "express";
const router = Router();

import { getWorks, getWorkById } from "../controllers/work.controller.js";

router.get("/", getWorks);

router.get("/:taskId", getWorkById);

export default router;