const express = require("express");
const router = express.Router();

const technicianController = require(
  "../controllers/technician.controller"
);

router.post(
  "/register",
  technicianController.registerTechnician
);

router.post(
  "/login",
  technicianController.loginTechnician
);

module.exports = router;