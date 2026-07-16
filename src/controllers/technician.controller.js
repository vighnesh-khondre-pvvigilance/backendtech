// import { registerTechnician, loginTechnician } from "../services/technician.service";

export async function registerTechnician(req, res) {
  try {
    const result =
      await registerTechnician(
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
}

//login 
export async function loginTechnician(
  req,
  res
) {
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
      await loginTechnician(
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
}