// import { getPlantsByClient, getPlantById } from "../services/plant.service";

/**
 * Get all plants by client
 */
export async function getPlantsByClient(req, res) {
    try {
      const { clientId } =
        req.params;

      const plants =
        await getPlantsByClient(
          clientId
        );

      res.status(200).json({
        statusCode: 200,
        success: true,
        message:
          "Solar plants retrieved successfully",
        data: plants,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch plants",
      });
    }
  }

/**
 * Get single plant
 */
export async function   getPlantById(req, res) {
    try {
      const { plantId } =
        req.params;

      const plant =
        await getPlantById(
          plantId
        );

      if (!plant) {
        return res.status(404).json({
          success: false,
          message:
            "Plant not found",
        });
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        message:
          "Solar plants retrieved successfully",
        data: [plant], // same format as company API
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch plant",
      });
    }
  }