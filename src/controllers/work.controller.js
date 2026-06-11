const {
  getWorksByTechnician,
  getWork,
} = require("../services/work.service");

exports.getWorks = async (req, res) => {
  try {
    const { technicianId } = req.query;

    const works =
      await getWorksByTechnician(
        technicianId
      );

    res.json(works);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch works",
    });
  }
};

exports.getWorkById = async (
  req,
  res
) => {
  try {
    const { taskId } = req.params;

    const work =
      await getWork(taskId);

    if (!work) {
      return res.status(404).json({
        message: "Work not found",
      });
    }

    res.json(work);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch work",
    });
  }
};