const clientService =
  require("../services/client.service");

exports.getClients =
  async (req, res) => {
    try {
      const clients =
        await clientService.getClients();

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
  };