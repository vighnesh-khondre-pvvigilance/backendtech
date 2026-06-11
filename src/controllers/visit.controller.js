const visitService =
  require("../services/visit.service");

/**
 * Final Visit Submission
 */
exports.createVisit = async (req, res) => {
  try {
    console.log("=== SUBMIT VISIT START ===");
    console.log(JSON.stringify(req.body, null, 2));

    const visit = await visitService.createVisit(req.body);

    console.log("visit is : ", visit);

    res.status(201).json({
      success: true,
      message: "Visit submitted successfully",
      data: visit,
    });
  } catch (error) {
    console.error("createVisit error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit visit",
      error: error.message,
    });
  }
};

/**
 * Get Visit
 */
exports.getVisit = async (
  req,
  res
) => {
  try {
    const { visitId } =
      req.params;

    const visit =
      await visitService.getVisit(
        visitId
      );

    if (!visit) {
      return res.status(404).json({
        success: false,
        message:
          "Visit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    console.error(
      "getVisit error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch visit",
      error: error.message,
    });
  }
};