import * as usageService from "./usage.service.js";

// Helper to extract userId from JWT user, query param, or header
const resolveUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.query?.userId ||
    req.headers["x-user-id"] ||
    null
  );
};

export const getOverview = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const timeframe = req.query?.timeframe || "24h";

    const overview = await usageService.getDashboardOverview(userId, timeframe);
    return res.status(200).json(overview);
  } catch (error) {
    console.error("Failed to get dashboard overview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch usage overview",
      error: error.message,
    });
  }
};

export const getRequestsTimeSeries = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const timeframe = req.query?.timeframe || "24h";

    const data = await usageService.getRequestsTimeSeries(userId, timeframe);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Failed to get requests time series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch requests time series",
      error: error.message,
    });
  }
};

export const getTokensTimeSeries = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const timeframe = req.query?.timeframe || "24h";

    const data = await usageService.getRequestsTimeSeries(userId, timeframe);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Failed to get tokens time series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tokens time series",
      error: error.message,
    });
  }
};

export const getLatencyTimeSeries = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const timeframe = req.query?.timeframe || "24h";

    const data = await usageService.getRequestsTimeSeries(userId, timeframe);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Failed to get latency time series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch latency time series",
      error: error.message,
    });
  }
};

export const getModelWiseUsage = async (req, res) => getModelUsage(req, res);
export const getModelUsage = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const overview = await usageService.getDashboardOverview(userId);
    return res.status(200).json(overview.llmPerformance?.modelConsumption || []);
  } catch (error) {
    console.error("Failed to get model usage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch model usage",
      error: error.message,
    });
  }
};

export const getRagPerformance = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const overview = await usageService.getDashboardOverview(userId);
    return res.status(200).json(overview.ragPerformance || null);
  } catch (error) {
    console.error("Failed to get RAG performance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch RAG performance",
      error: error.message,
    });
  }
};

export const getRequestHistory = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { limit = 50, status = "all", search = "" } = req.query;

    const data = await usageService.getRequestHistory(userId, {
      limit: Number(limit) || 50,
      status,
      search,
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Failed to get request history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch request history",
      error: error.message,
    });
  }
};

