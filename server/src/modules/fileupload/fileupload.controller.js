import fs from "node:fs";
import { saveFileRecord } from "./fileupload.service.js";
import { generateEmbeddingStoreDB } from "../rag/rag.service.js";
import { getOrCreateApiKey } from "../api_generate/api.service.js";

// Handle file upload and generate embeddings
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user?.id || req.body?.userId || "user";
    const filePath = req.file.path;

    // Generate embeddings for the uploaded file
    const embeddingResult = await generateEmbeddingStoreDB(userId, filePath);
    
    // Retain the uploaded PDF in uploads folder after generating embeddings (not deleted automatically)
    if (embeddingResult.status === 200) {
      // Save uploaded file metadata to database
      const fileRecord = await saveFileRecord({
        userId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: filePath,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
      
      // Retrieve or create the user's API key
      const apiKeyRecord = await getOrCreateApiKey(userId);

      const protocol = req.protocol;
      const host = req.get("host");
      const chatEndpointWithKey = `${protocol}://${host}/api/${userId}/${apiKeyRecord.api_key}/chat`;
      const chatEndpoint = `${protocol}://${host}/api/${userId}/chat`;

      return res.status(200).json({
        success: true,
        message: embeddingResult.message || "Documents Added Successfully",
        apiKey: apiKeyRecord.api_key,
        apiEndpoint: chatEndpointWithKey,
        chatEndpoint,
        file: fileRecord,
        processedFiles: embeddingResult.processedFiles,
      });
    }

    // In case embedding generation returned a non-200 status
    return res.status(embeddingResult.status || 400).json({
      success: false,
      message: embeddingResult.message || "Failed to generate embeddings",
    });
  } catch (error) {
    // If processing failed, clean up the temporary uploaded file
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded file:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "File processing failed",
      error: error.message,
    });
  }
};
