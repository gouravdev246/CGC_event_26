import { Router } from "express";
import { uploadFile, listFiles, deleteFile } from "./fileupload.controller.js";
import { upload } from "./fileupload.service.js";
import { verifyToken } from "../auth/auth.middleware.js";
import { enforceDocumentLimit } from "../subscription/usage.middleware.js";

const router = Router();

// Route to list files uploaded by user
router.get("/", verifyToken, listFiles);

// Route to upload a file (checks document limit before and after upload)
router.post(
  "/upload",
  verifyToken,
  enforceDocumentLimit,
  upload.single("file"),
  uploadFile
);

// Route to delete file
router.delete("/:id", verifyToken, deleteFile);

export default router;
