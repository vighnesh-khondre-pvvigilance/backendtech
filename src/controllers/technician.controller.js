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

//login 
exports.loginTechnician = async (
  req,
  res
) => {
  try {
    const {
      technician_id,
      password,
    } = req.body;

    if (
      !technician_id ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Technician ID and password are required",
      });
    }

    const result =
      await technicianService.loginTechnician(
        technician_id,
        password
      );

    return res.status(200).json({
      success: true,
      message:
        "Login successful",
      token: result.token,
      data: result.technician,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};