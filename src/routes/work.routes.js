const express = require("express");
const router = express.Router();

const {
  getWorks,
  getWorkById,
} = require("../controllers/work.controller");

router.get("/", getWorks);

router.get("/:taskId", getWorkById);

module.exports = router;