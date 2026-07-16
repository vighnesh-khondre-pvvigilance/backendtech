// import { createVisit, getVisit } from "../services/visit.service";

/**
 * Final Visit Submission
 */
export async function createVisit(req, res) {
  try {
    console.log(
      "=== SUBMIT VISIT START ==="
    );

    console.log(
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    const visit =
      await createVisit(
        req.body
      );

    console.log(
      "visit is : ",
      visit
    );

    return res.status(201).json({
      statusCode: 201,
      data: visit,
      message:
        "Visit form and notification added successfully",
      success: true,
    });
  } catch (error) {
    console.error(
      "createVisit error:",
      error
    );

    return res.status(500).json({
      statusCode: 500,
      data: null,
      message:
        "Failed to submit visit",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get Visit
 */
export async function getVisit(
  req,
  res
) {
  try {
    const { visitId } =
      req.params;

    const visit =
      await getVisit(
        visitId
      );

    if (!visit) {
      return res.status(404).json({
        statusCode: 404,
        data: null,
        message:
          "Visit not found",
        success: false,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      data: visit,
      message:
        "Visit fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error(
      "getVisit error:",
      error
    );

    return res.status(500).json({
      statusCode: 500,
      data: null,
      message:
        "Failed to fetch visit",
      success: false,
      error: error.message,
    });
  }
}