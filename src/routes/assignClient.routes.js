import express from "express";
import { assignClientsToTechnician, removeNotificationToken, saveNotificationToken } from "../controllers/assignClient.controller.js";

const router = express.Router();

router.post("/assign-clients", assignClientsToTechnician);
router.post("/remove-token", removeNotificationToken);
router.post("/save-token", saveNotificationToken); // 🔥 new


export default router;