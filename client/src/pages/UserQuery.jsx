import React, { useState, useEffect } from 'react';
import { Search, Send, Sparkles, Clock, CheckCircle2, Layers, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { apiService } from '../services/api';

export function UserQuery() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('rag_user_id') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('rag_api_key') || '');

  const navigate = useNavigate();

  useEffect(() => {
    async function initUserAndKey() {
      try {
        if (!userId) {
          const me = await apiService.getMe();
          if (me?.user?.id || me?.user?._id) {
            const uid = me.user.id || me.user._id;
            setUserId(uid);
            localStorage.setItem('rag_user_id', uid);
          }
        }

        if (!apiKey) {
          const keyRes = await apiService.getCurrentApiKey();
          if (keyRes?.apiKey) {
            setApiKey(keyRes.apiKey);
            localStorage.setItem('rag_api_key', keyRes.apiKey);
          }
        }
      } catch (err) {
        console.error('Initialization error in UserQuery:', err);
      }
    }

    initUserAndKey();
  }, [userId, apiKey]);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setErrorMsg('');
    setLoading(true);
    const startTime = performance.now();

    try {
      let activeUserId = userId;
      let activeApiKey = apiKey;

      if (!activeUserId || !activeApiKey) {
        const keyData = await apiService.getCurrentApiKey();
        if (keyData?.apiKey) {
          activeApiKey = keyData.apiKey;
          setApiKey(activeApiKey);
        }
        const meData = await apiService.getMe();
        if (meData?.user?.id || meData?.user?._id) {
          activeUserId = meData.user.id || meData.user._id;
          setUserId(activeUserId);
        }
      }

      if (!activeUserId || !activeApiKey) {
        throw new Error('API Key or User ID not found. Please upload a document or generate an API key first.');
      }

      // Execute live semantic search & LLM generation via backend
      const res = await apiService.queryRAG({
        userId: activeUserId,
        apiKey: activeApiKey,
        message: query.trim(),
        k: 4
      });

      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      const generatedAnswer = res.answer || res.response || 'No answer returned.';

      const newRequest = {
        id: `REQ-${Date.now().toString().slice(-4)}`,
        query: query.trim(),
        answer: generatedAnswer,
        sources: res.sources || [],
        responseTime: durationMs / 1000,
        status: 'success',
        statusCode: 200,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
        inputTokens: Math.round(query.trim().split(' ').length * 1.4 + 25),
        outputTokens: Math.round(generatedAnswer.split(' ').length * 1.3),
        knowledgeBase: 'Uploaded Documents'
      };

      // Save to real recent telemetry history
      const existing = JSON.parse(localStorage.getItem('rag_recent_queries') || '[]');
      const updated = [newRequest, ...existing.slice(0, 19)];
      localStorage.setItem('rag_recent_queries', JSON.stringify(updated));

      setLatestResult(newRequest);
      setQuery('');
    } catch (err) {
      console.error('RAG query error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to retrieve answer from knowledge base.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
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
          <p className="header-page-subtitle">Test questions against your vector-indexed documents in real time.</p>
        </div>
      </header>

      <div className="dashboard-vertical-sections">
        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Query Input Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <Search size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Ask Your Knowledge Base.</h2>
                <p className="section-subtext">Find answers grounded strictly in your uploaded documents.</p>
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
              {loading ? 'Searching & Generating...' : 'Ask RAG'}
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
                  <p className="section-subtext">Live answer from Pinecone vector search & LLM generation</p>
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
                <span className="detail-block-title">Grounded AI Answer</span>
              </div>
              <div className="detail-content-box answer-box">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{latestResult.answer}</p>
              </div>
            </div>

            {/* Retrieved Document Citations / Sources */}
            {latestResult.sources && latestResult.sources.length > 0 && (
              <div className="detail-block" style={{ marginTop: '14px' }}>
                <div className="detail-block-header">
                  <span className="detail-block-title">
                    Retrieved Knowledge Sources ({latestResult.sources.length} chunks)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {latestResult.sources.map((src, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#0b0f19',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#93c5fd', marginBottom: '4px', fontWeight: 600 }}>
                        <span>Chunk #{i + 1}</span>
                        {src.metadata?.page && <span>Page {src.metadata.page}</span>}
                      </div>
                      <p style={{ color: '#d1d5db', lineHeight: 1.4, margin: 0 }}>
                        "{src.content}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
