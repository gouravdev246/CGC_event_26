import { saveFileRecord } from "./fileupload.service.js";

// Handle file upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user?.id || req.body?.userId || "user";

    // Save uploaded file info to database
    const fileRecord = await saveFileRecord({
      userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: fileRecord,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};

