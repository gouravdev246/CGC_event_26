import React, { useState } from 'react';
import { Search, Send, Sparkles, Clock, CheckCircle2, Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export function UserQuery() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const navigate = useNavigate();

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const startTime = performance.now();

    // Simulate RAG pipeline latency (vector search + LLM generation)
    await new Promise((resolve) => setTimeout(resolve, 380));
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    const generatedAnswer = `Based on the indexed document context, the query "${query.trim()}" requires adherence to verified academic policy: attendance is maintained at a minimum 75% threshold with standard makeup provisions.`;

    const newRequest = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      query: query.trim(),
      answer: generatedAnswer,
      responseTime: durationMs / 1000,
      status: 'success',
      statusCode: 200,
      timestamp: new Date().toISOString(),
      model: 'gemini-1.5-pro',
      inputTokens: Math.round(query.trim().split(' ').length * 1.4 + 25),
      outputTokens: Math.round(generatedAnswer.split(' ').length * 1.3),
      knowledgeBase: 'Policy Docs'
    };

    // Save to real recent telemetry history
    const existing = JSON.parse(localStorage.getItem('rag_recent_queries') || '[]');
    const updated = [newRequest, ...existing.slice(0, 19)];
    localStorage.setItem('rag_recent_queries', JSON.stringify(updated));

    setLatestResult(newRequest);
    setLoading(false);
    setQuery('');
  };

  return (
    <div className="dashboard-page-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">RAG Service</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">User Query</span>
          </div>
          <h1 className="header-page-title">Ask Your Knowledge Base.</h1>
          <p className="header-page-subtitle">Find answers from your own data.</p>
        </div>
      </header>

      <div className="dashboard-vertical-sections">
        {/* Query Input Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <Search size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Ask Your Knowledge Base.</h2>
                <p className="section-subtext">Find answers from your own data.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAsk} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Ask anything about your documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              style={{ flex: 1, padding: '12px 16px', fontSize: '14px', width: 'auto' }}
              disabled={loading}
            />
            <Button variant="primary" icon={Send} type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Retrieving...' : 'Ask RAG'}
            </Button>
          </form>
        </section>

        {/* Latest Response Card */}
        {latestResult && (
          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-title-wrapper">
                <div className="section-icon-badge requests-badge">
                  <Sparkles size={20} className="section-icon text-indigo" />
                </div>
                <div>
                  <h2 className="section-heading">Query Execution Result</h2>
                  <p className="section-subtext">Logged to request history</p>
                </div>
              </div>
              <Badge variant="success" size="sm" dot>
                {latestResult.statusCode} OK • {(latestResult.responseTime * 1000).toFixed(0)} ms
              </Badge>
            </div>

            <div className="detail-block">
              <div className="detail-block-header">
                <span className="detail-block-title">user query</span>
              </div>
              <div className="detail-content-box query-box">
                <p>{latestResult.query}</p>
              </div>
            </div>

            <div className="detail-block" style={{ marginTop: '14px' }}>
              <div className="detail-block-header">
                <span className="detail-block-title">llm ans</span>
              </div>
              <div className="detail-content-box answer-box">
                <p>{latestResult.answer}</p>
              </div>
            </div>

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-subtext">
                This query was logged and is now visible in the main dashboard request stream.
              </span>
              <button
                type="button"
                className="filter-btn active"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>View in all requests</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default UserQuery;

