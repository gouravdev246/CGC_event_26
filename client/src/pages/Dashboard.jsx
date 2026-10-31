import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import DashboardHeader from '../components/layout/DashboardHeader';
import UsageMonitoring from '../components/dashboard/UsageMonitoring';
import AllRequests from '../components/dashboard/AllRequests';

export function Dashboard() {
  const {
    apiConsumption,
    tokenConsumption,
    llmPerformance,
    ragPerformance,
    requestsTimeSeries,
    timeframe,
    setTimeframe,
    requests,
    rawRequestsCount,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedRequest,
    setSelectedRequest,
    loading,
    refreshing,
    handleRefresh
  } = useDashboard();

  return (
    <div className="dashboard-page-container">
      {/* Top Header */}
      <DashboardHeader
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Main Content Area: Exactly two large sections arranged vertically matching the sketch */}
      <div className="dashboard-vertical-sections">
        {/* Section 1: Usage matrix monitoring */}
        <UsageMonitoring
          apiConsumption={apiConsumption}
          tokenConsumption={tokenConsumption}
          llmPerformance={llmPerformance}
          ragPerformance={ragPerformance}
          requestsTimeSeries={requestsTimeSeries}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          loading={loading}
        />

        {/* Section 2: all requests */}
        <AllRequests
          requests={requests}
          rawRequestsCount={rawRequestsCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedRequest={selectedRequest}
          setSelectedRequest={setSelectedRequest}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Dashboard;

