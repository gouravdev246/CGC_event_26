import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    apiKey: {
      type: String,
      default: null,
    },
    query: {
      type: String,
      required: true,
    },
    improvedQuery: {
      type: String,
      default: "",
    },
    answer: {
      type: String,
      default: "",
    },
    sources: {
      type: Array,
      default: [],
    },
    retrievalMatches: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["success", "error"],
      default: "success",
      index: true,
    },
    statusCode: {
      type: Number,
      default: 200,
    },
    responseTime: {
      type: Number, // Latency in seconds (e.g. 1.25)
      default: 0,
    },
    latencyMs: {
      type: Number, // Latency in milliseconds (e.g. 1250)
      default: 0,
    },
    model: {
      type: String,
      default: "blaxel-sandbox-openai",
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by user and creation date
usageLogSchema.index({ userId: 1, createdAt: -1 });

export const UsageLog = mongoose.model("UsageLog", usageLogSchema);

