const express = require("express");

const router = express.Router();

const visitController = require(
  "../controllers/visit.controller"
);

router.post(
  "/",
  visitController.createVisit
);

router.get(
  "/:visitId",
  visitController.getVisit
);





module.exports = router;