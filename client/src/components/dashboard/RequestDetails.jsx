import React, { useState } from 'react';
import { X, Copy, Check, Clock, Cpu, FileText, Database, Layers, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDuration, formatRelativeTime, formatNumber } from '../../utils/formatters';

export function RequestDetails({ request, onClose }) {
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  if (!request) return null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'query') {
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    } else {
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  const isSuccess = request.status === 'success';
  const totalTokens = request.totalTokens || (request.inputTokens || 0) + (request.outputTokens || 0) || request.tokens || 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog request-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-request-id">{request.id}</span>
            <Badge variant={isSuccess ? 'success' : 'error'} size="sm" dot>
              {isSuccess ? `${request.statusCode || 200} Success` : `${request.statusCode || 500} Error`}
            </Badge>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Quick Stats Banner - Response Time, Model, Input/Output/Total Tokens */}
          <div className="modal-stats-banner">
            <div className="modal-stat-item">
              <Clock size={16} className="modal-stat-icon text-indigo" />
              <div>
                <span className="modal-stat-label">Response Time</span>
                <span className="modal-stat-value">{formatDuration(request.responseTime)}</span>
              </div>
            </div>

            <div className="modal-stat-item">
              <Database size={16} className="modal-stat-icon text-cyan" />
              <div>
                <span className="modal-stat-label">Model Used</span>
                <span className="modal-stat-value">{request.model || 'gemini-1.5-pro'}</span>
              </div>
            </div>

            <div className="modal-stat-item">
              <ArrowDownRight size={16} className="modal-stat-icon text-indigo" />
              <div>
                <span className="modal-stat-label">Input Tokens</span>
                <span className="modal-stat-value">{formatNumber(request.inputTokens || 0)} tok</span>
              </div>
            </div>

            <div className="modal-stat-item">
              <ArrowUpRight size={16} className="modal-stat-icon text-purple" />
              <div>
                <span className="modal-stat-label">Output Tokens</span>
                <span className="modal-stat-value">{formatNumber(request.outputTokens || 0)} tok</span>
              </div>
            </div>

            <div className="modal-stat-item">
              <Cpu size={16} className="modal-stat-icon text-emerald" />
              <div>
                <span className="modal-stat-label">Total Tokens</span>
                <span className="modal-stat-value">{formatNumber(totalTokens)} tok</span>
              </div>
            </div>
          </div>

          {/* User Query Block */}
          <div className="detail-block">
            <div className="detail-block-header">
              <span className="detail-block-title">User Query</span>
              <button
                type="button"
                className="copy-btn"
                onClick={() => handleCopy(request.query, 'query')}
              >
                {copiedQuery ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copiedQuery ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="detail-content-box query-box">
              <p>{request.query}</p>
            </div>
          </div>

          {/* LLM Answer Block */}
          <div className="detail-block">
            <div className="detail-block-header">
              <span className="detail-block-title">LLM Response Preview / Answer</span>
              <button
                type="button"
                className="copy-btn"
                onClick={() => handleCopy(request.answer, 'answer')}
              >
                {copiedAnswer ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className={`detail-content-box answer-box ${!isSuccess ? 'error-box' : ''}`}>
              <p>{request.answer}</p>
            </div>
          </div>

          {/* Retrieved Source Citations / RAG Chunks */}
          {request.knowledgeBase && (
            <div className="detail-block">
              <div className="detail-block-header">
                <span className="detail-block-title">
                  RAG Retrieval Context &amp; Knowledge Base
                </span>
                <span className="detail-kb-tag">{request.knowledgeBase}</span>
              </div>
              <div className="sources-list">
                <div className="source-chip">
                  <Layers size={14} className="text-indigo" />
                  <span className="source-doc-name">{request.knowledgeBase}</span>
                  <span className="source-score">{request.chunksRetrieved || 3} chunks retrieved</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="timestamp-note">
            Logged {formatRelativeTime(request.timestamp)} • Timestamp:{' '}
            {new Date(request.timestamp).toLocaleString()}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RequestDetails;
