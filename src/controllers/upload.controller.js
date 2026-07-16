// import { generateUploadUrl } from "../services/upload.service.js";

export async function generatePresignedUrl(req, res) {
     console.log("REQ BODY");
    console.log(req.body);
    try {
      const {
        plantId,
        fileName,
        type,
      } = req.body;
       console.log({
      plantId,
      fileName,
      type,
    });

      if (
        !plantId ||
        !fileName ||
        !type
      ) {
        return res.status(400).json({
          success: false,
          message:
            "plantId, fileName and type are required",
        });
      }

      const result =
        await generateUploadUrl(
          {
            plantId,
            fileName,
            type,
          }
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to generate upload URL",
      });
    }
  }