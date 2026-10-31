import { Router } from "express";
import { uploadFile } from "./fileupload.controller.js";
import { upload } from "./fileupload.service.js";
import { verifyToken } from "../auth/auth.middleware.js";

const router = Router();

// Middleware to use auth token if present
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return verifyToken(req, res, next);
  }
  next();
};

// Route to upload a file (stored in server/uploads as user_id_filename.pdf)
router.post("/upload", optionalAuth, upload.single("file"), uploadFile);

export default router;

