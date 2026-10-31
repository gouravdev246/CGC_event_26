import React from 'react';
import { ListFilter, Search, MessageSquareCode, CheckCircle, AlertTriangle } from 'lucide-react';
import RequestItem from './RequestItem';
import RequestDetails from './RequestDetails';
import Loader from '../common/Loader';

export function AllRequests({
  requests = [],
  rawRequestsCount = 0,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedRequest,
  setSelectedRequest,
  loading
}) {
  return (
    <section className="dashboard-section all-requests-container" aria-label="all requests">
      {/* Section Header */}
      <div className="section-header all-requests-header">
        <div className="section-title-wrapper">
          <div className="section-icon-badge requests-badge">
            <MessageSquareCode size={20} className="section-icon text-indigo" />
          </div>
          <div>
            <div className="title-with-count">
              <h2 className="section-heading">all requests</h2>
              <span className="count-badge">{requests.length} logged</span>
            </div>
            <p className="section-subtext">Query execution log with responses and latency</p>
          </div>
        </div>

        {/* Filter and Search Bar */}

        <div className="requests-toolbar">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search query or answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="status-filter-pills">
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter && setStatusFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'success' ? 'active' : ''}`}
              onClick={() => setStatusFilter && setStatusFilter('success')}
            >
              Success
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'error' ? 'active' : ''}`}
              onClick={() => setStatusFilter && setStatusFilter('error')}
            >
              Errors
            </button>
          </div>
        </div>
      </div>

      {/* Requests Content inside single large rounded section */}
      <div className="all-requests-content">
        {loading ? (
          <Loader text="Fetching recent requests..." />
        ) : requests.length === 0 ? (
          <div className="empty-requests-state">
            <div className="empty-state-icon-wrap">
              <MessageSquareCode size={36} className="text-muted" />
            </div>
            <p className="empty-title">
              {searchQuery ? 'No matching requests found' : 'No requests recorded yet'}
            </p>
            <p className="empty-subtitle">
              {searchQuery
                ? 'Try adjusting your search terms or filter criteria.'
                : 'Execute queries in the user query playground to populate live execution telemetry.'}
            </p>
            {!searchQuery && (
              <div style={{ marginTop: '16px' }}>
                <a
                  href="/user-query"
                  className="filter-btn active"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', textDecoration: 'none' }}
                >
                  Go to user query playground →
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="requests-list-stream">
            {requests.map((req, idx) => (
              <RequestItem
                key={req.id || idx}
                index={idx}
                request={req}
                onSelect={(r) => setSelectedRequest && setSelectedRequest(r)}
              />
            ))}
          </div>
        )}
      </div>


      {/* Detail Modal for Selected Request */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest && setSelectedRequest(null)}
        />
      )}
    </section>
  );
}

export default AllRequests;
