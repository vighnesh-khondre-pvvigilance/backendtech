// import { getClients } from "../services/client.service";

export async function getClients(req, res) {
    try {
      const clients =
        await getClients();

      res.status(200).json({
        success: true,
        message:
          "Clients fetched successfully",
        data: clients,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch clients",
      });
    }
  }