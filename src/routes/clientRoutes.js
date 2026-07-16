import { Router } from "express";

const router =
  Router();

import { getClients } from "../controllers/clientController.js";

router.get("/", getClients);

export default router;