import multer from "multer";
import path from "path";
import fs from "fs";
import { File } from "./fileupload.module.js";

// Ensure uploads folder exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage: saves as user_id_filename.pdf in server/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || req.body?.userId || "user";
    cb(null, `${userId}_${file.originalname}`);
  },
});

export const upload = multer({ storage });

// Save file metadata to MongoDB
export const saveFileRecord = async (fileData) => {
  return await File.create(fileData);
};

