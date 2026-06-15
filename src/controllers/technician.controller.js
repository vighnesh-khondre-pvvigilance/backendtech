const technicianService = require("../services/technician.service");

exports.registerTechnician = async (req, res) => {
  try {
    const result =
      await technicianService.registerTechnician(
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Technician registration submitted",
      data: result,
    });
  } catch (error) {
    console.error("REGISTER TECH ERROR", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to register technician",
    });
  }
};