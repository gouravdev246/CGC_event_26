import fs from "fs";
import mongoose from "mongoose";
import { saveFileRecord } from "./fileupload.service.js";
import { File } from "./fileupload.module.js";
import { saveUser, countUserDocuments } from "../subscription/subscription.controller.js";

// In-memory files cache fallback if MongoDB is disconnected
export const inMemoryFiles = [];

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
    let fileRecord;

    if (mongoose.connection.readyState === 1) {
      fileRecord = await saveFileRecord({
        userId: String(userId),
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } else {
      fileRecord = {
        _id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        id: `file_${Date.now()}`,
        userId: String(userId),
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        createdAt: new Date().toISOString()
      };
      inMemoryFiles.push(fileRecord);
    }

    // Sync user documents count
    if (req.currentUser) {
      const updatedCount = await countUserDocuments(userId) || inMemoryFiles.filter(f => f.userId === String(userId)).length;
      if (!req.currentUser.subscription) req.currentUser.subscription = {};
      req.currentUser.subscription.documentsUsed = updatedCount;
      await saveUser(req.currentUser);
    }

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: fileRecord,
      usage: {
        documentsUsed: req.currentUser?.subscription?.documentsUsed || 1,
        documentLimit: req.currentUser?.subscription?.documentLimit || 2
      }
    });
  } catch (error) {
    // If upload fails, cleanup file from disk
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    return res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};

// List uploaded files for user
export const listFiles = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId || "user";
    let files = [];

    if (mongoose.connection.readyState === 1) {
      files = await File.find({ userId: String(userId) }).sort({ createdAt: -1 });
    } else {
      files = inMemoryFiles.filter(f => f.userId === String(userId));
    }

    return res.json({
      success: true,
      files,
      count: files.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete uploaded file
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "user";

    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      const file = await File.findOneAndDelete({ _id: id, userId: String(userId) });
      if (file) {
        if (file.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
        deleted = true;
      }
    } else {
      const index = inMemoryFiles.findIndex(f => (f._id === id || f.id === id) && f.userId === String(userId));
      if (index !== -1) {
        const file = inMemoryFiles.splice(index, 1)[0];
        if (file.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
        deleted = true;
      }
    }

    // Decrement user document count
    if (req.currentUser && req.currentUser.subscription?.documentsUsed > 0) {
      req.currentUser.subscription.documentsUsed -= 1;
      await saveUser(req.currentUser);
    }

    return res.json({
      success: true,
      message: deleted ? "File deleted successfully" : "File not found or already deleted"
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
