import express from "express";
import { assignClientToTechnician, removeNotificationToken } from "../controllers/assignClient.controller.js";

const router = express.Router();

router.post("/assign-client", assignClientToTechnician);
router.post("/remove-token", removeNotificationToken);


export default router;