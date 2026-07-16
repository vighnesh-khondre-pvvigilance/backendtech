import { Router } from "express";
const router = Router();

import { registerTechnician, loginTechnician } from "../controllers/technician.controller.js";

router.post(
  "/register",
  registerTechnician
);

router.post(
  "/login",
  loginTechnician
);

export default router;