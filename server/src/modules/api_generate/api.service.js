import crypto from "node:crypto";
import { ApiKey } from "./api.model.js";

/**
 * Generate a new secure API key for a user.
 * Replaces existing key or creates a new one.
 */
export async function generateApiKey(userId) {
  const newKey = `cgc_${crypto.randomBytes(24).toString("hex")}`;

  const record = await ApiKey.findOneAndUpdate(
    { userId },
    { api_key: newKey, userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return record;
}

/**
 * Get the active API key for a user, or create one if none exists.
 */
export async function getOrCreateApiKey(userId) {
  let record = await ApiKey.findOne({ userId });

  if (!record) {
    record = await generateApiKey(userId);
  }

  return record;
}

/**
 * Validate that an API key belongs to a specific user.
 */
export async function validateApiKey(userId, apiKey) {
  if (!userId || !apiKey) {
    return false;
  }

  const record = await ApiKey.findOne({
    userId,
    api_key: apiKey.trim(),
  });

  return Boolean(record);
}

