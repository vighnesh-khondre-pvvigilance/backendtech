import { Router } from "express";

const router =
  Router();

import { getPlantsByClient, getPlantById } from "../controllers/plantController.js";

router.get(
  "/client/:clientId",
  getPlantsByClient
);
router.get(
  "/:plantId",
  getPlantById
);

export default router;