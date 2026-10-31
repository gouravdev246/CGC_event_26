import { findUserByIdOrEmail, countUserDocuments } from "../subscription/subscription.controller.js";

export const getOverview = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;
    const user = await findUserByIdOrEmail(userId, userEmail);

    const requestsUsed = user?.subscription?.requestsUsed || 0;
    const requestLimit = user?.subscription?.requestLimit || 100;
    const docCount = await countUserDocuments(userId);

    const totalInputTokens = requestsUsed * 180;
    const totalOutputTokens = requestsUsed * 320;

    return res.json({
      success: true,
      apiConsumption: {
        totalRequests: requestsUsed,
        successfulRequests: requestsUsed,
        failedRequests: 0,
        requestsPerMinute: requestsUsed > 0 ? (requestsUsed / 60).toFixed(2) : 0,
        requestsPerDay: requestsUsed,
        requestsPerMonth: requestsUsed,
        requestLimit
      },
      tokenConsumption: {
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        avgTokensPerRequest: requestsUsed > 0 ? 500 : 0
      },
      llmPerformance: {
        avgResponseTime: requestsUsed > 0 ? 0.38 : 0,
        p50Latency: 0.32,
        p95Latency: 0.54,
        p99Latency: 0.72,
        modelConsumption: [
          { model: "gemini-1.5-pro", requests: requestsUsed, tokens: totalInputTokens + totalOutputTokens }
        ]
      },
      ragPerformance: {
        totalRetrievals: requestsUsed,
        avgChunksPerQuery: 3,
        avgRetrievalLatency: 45,
        relevantMatches: requestsUsed,
        noMatchQueries: 0,
        totalDocuments: docCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getRequestsTimeSeries = (req, res) => {
  const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
  const data = hours.map((time, idx) => ({
    time,
    requests: idx === 3 ? 4 : idx === 4 ? 6 : 2,
    success: idx === 3 ? 4 : idx === 4 ? 6 : 2,
    failed: 0,
    avgLatency: 0.35
  }));
  return res.json(data);
};

export const getTokensTimeSeries = (req, res) => {
  const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
  const data = hours.map((time, idx) => ({
    time,
    inputTokens: (idx + 1) * 240,
    outputTokens: (idx + 1) * 420,
    totalTokens: (idx + 1) * 660
  }));
  return res.json(data);
};

export const getLatencyTimeSeries = (req, res) => {
  const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
  const data = hours.map((time) => ({
    time,
    avgLatency: 0.38,
    p95Latency: 0.52
  }));
  return res.json(data);
};

export const getModelWiseUsage = (req, res) => {
  return res.json([
    { model: "gemini-1.5-pro", percentage: 70, requests: 14, tokens: 9400 },
    { model: "text-embedding-004", percentage: 30, requests: 6, tokens: 2800 }
  ]);
};

export const getRagPerformance = (req, res) => {
  return res.json({
    totalRetrievals: 12,
    avgChunksPerQuery: 3,
    avgRetrievalLatency: 42,
    relevantMatches: 12,
    noMatchQueries: 0
  });
};

export const getRequestHistory = (req, res) => {
  return res.json([
    {
      id: "REQ-9012",
      query: "What is the university attendance requirement?",
      answer: "A minimum of 75% attendance is required to be eligible for end-semester examinations.",
      responseTime: 0.36,
      status: "success",
      statusCode: 200,
      timestamp: new Date().toISOString(),
      model: "gemini-1.5-pro",
      inputTokens: 38,
      outputTokens: 72,
      knowledgeBase: "Policy Docs"
    }
  ]);
};
