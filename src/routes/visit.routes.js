import { Router } from "express";

const router = Router();

import { createVisit, getVisit } from "../controllers/visit.controller.js";

router.post(
  "/",
  createVisit
);

router.get(
  "/:visitId",
  getVisit
);





export default router;