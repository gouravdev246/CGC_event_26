import React from 'react';
import { ArrowRight, Clock, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

export function RequestItem({ index, request, onSelect }) {
  if (!request) return null;

  const isSuccess = request.status === 'success';

  return (
    <div
      className={`request-flow-card ${isSuccess ? 'flow-success' : 'flow-error'}`}
      onClick={() => onSelect && onSelect(request)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect && onSelect(request);
        }
      }}
    >
      {/* 1. Index prefix */}
      <div className="flow-index-prefix">
        <span className="flow-index-num">{index + 1}.</span>
      </div>

      {/* 2. User Query segment */}
      <div className="flow-segment user-query-segment">
        <span className="flow-tag user-query-tag">
          <MessageSquare size={13} className="flow-tag-icon" />
          <span>user query</span>
        </span>
        <span className="flow-text query-string" title={request.query}>
          {request.query}
        </span>
      </div>

      {/* Arrow Divider */}
      <div className="flow-arrow-divider" aria-hidden="true">
        <ArrowRight size={15} className="flow-arrow-icon" />
      </div>

      {/* 3. LLM Ans segment */}
      <div className="flow-segment llm-ans-segment">
        <span className="flow-tag llm-ans-tag">
          <Sparkles size={13} className="flow-tag-icon" />
          <span>llm ans</span>
        </span>
        <span className="flow-text ans-string" title={request.answer}>
          {request.answer}
        </span>
      </div>

      {/* Arrow Divider */}
      <div className="flow-arrow-divider" aria-hidden="true">
        <ArrowRight size={15} className="flow-arrow-icon" />
      </div>

      {/* 4. Response Time segment */}
      <div className="flow-segment response-time-segment">
        <span className="flow-tag response-time-tag">
          <Clock size={13} className="flow-tag-icon" />
          <span>response time</span>
        </span>
        <span className="flow-time-value">
          {formatDuration(request.responseTime)}
        </span>
      </div>

      {/* Chevron for more info */}
      <div className="flow-action-indicator" title="View details">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

export default RequestItem;

