const express =
  require("express");

const router =
  express.Router();

const {
  getPlantsByClient,
   getPlantById,
} = require(
  "../controllers/plantController"
);

router.get(
  "/client/:clientId",
  getPlantsByClient
);
router.get(
  "/:plantId",
  getPlantById
);

module.exports = router;