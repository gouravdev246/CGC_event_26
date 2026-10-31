import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';

export function useDashboard() {
  // Primary real data states
  const [overview, setOverview] = useState(null);
  const [requestsTimeSeries, setRequestsTimeSeries] = useState([]);
  const [tokensTimeSeries, setTokensTimeSeries] = useState([]);
  const [latencyTimeSeries, setLatencyTimeSeries] = useState([]);
  const [modelUsage, setModelUsage] = useState([]);
  const [requestsHistory, setRequestsHistory] = useState([]);

  // Timeframe and chart view
  const [timeframe, setTimeframe] = useState('24h');
  const [activeChartTab, setActiveChartTab] = useState('requests');

  // Filtering for All Requests list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Connection states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch telemetry from API service
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = { timeframe };

      const [
        overviewRes,
        requestsRes,
        tokensRes,
        latencyRes,
        modelsRes,
        historyRes
      ] = await Promise.all([
        apiService.getDashboardOverview(params),
        apiService.getRequestsTimeSeries(params),
        apiService.getTokensTimeSeries(params),
        apiService.getLatencyTimeSeries(params),
        apiService.getModelWiseUsage(params),
        apiService.getRequestHistory(params)
      ]);

      setOverview(overviewRes.data);
      setRequestsTimeSeries(requestsRes.data || []);
      setTokensTimeSeries(tokensRes.data || []);
      setLatencyTimeSeries(latencyRes.data || []);
      setModelUsage(modelsRes.data || []);
      setRequestsHistory(historyRes.data || []);
    } catch (err) {
      console.error('Failed to load usage monitoring metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filter requests history based on query and status
  const filteredRequests = useMemo(() => {
    if (!requestsHistory || !Array.isArray(requestsHistory)) return [];
    return requestsHistory.filter((req) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        req.query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.answer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requestsHistory, searchQuery, statusFilter]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  return {
    overview,
    apiConsumption: overview?.apiConsumption || null,
    tokenConsumption: overview?.tokenConsumption || null,
    llmPerformance: overview?.llmPerformance || null,
    ragPerformance: overview?.ragPerformance || null,
    requestsTimeSeries,
    tokensTimeSeries,
    latencyTimeSeries,
    modelUsage,
    activeChartTab,
    setActiveChartTab,
    timeframe,
    setTimeframe,
    requests: filteredRequests,
    rawRequestsCount: requestsHistory?.length || 0,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedRequest,
    setSelectedRequest,
    loading,
    refreshing,
    handleRefresh
  };
}

export default useDashboard;
