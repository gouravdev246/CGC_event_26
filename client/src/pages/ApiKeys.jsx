import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Code,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { apiService } from '../services/api';

export function ApiKeys() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('rag_api_key') || '');
  const [userId, setUserId] = useState(localStorage.getItem('rag_user_id') || '');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const rawApiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || 'https://raas.bemylove.in/api';
  const serverBase = rawApiBase.replace(/\/api\/?$/, '') || 'https://raas.bemylove.in';

  useEffect(() => {
    async function fetchKey() {
      try {
        setLoading(true);
        // Ensure user id is available
        const meRes = await apiService.getMe();
        if (meRes?.user?.id || meRes?.user?._id) {
          const currentUid = meRes.user.id || meRes.user._id;
          setUserId(currentUid);
          localStorage.setItem('rag_user_id', currentUid);
        }

        const res = await apiService.getCurrentApiKey();
        if (res && res.apiKey) {
          setApiKey(res.apiKey);
          localStorage.setItem('rag_api_key', res.apiKey);
        }
      } catch (err) {
        console.error('Failed to load API key:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchKey();
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCurl = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await apiService.generateApiKey();
      if (res && res.apiKey) {
        setApiKey(res.apiKey);
        localStorage.setItem('rag_api_key', res.apiKey);
      }
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const directEndpointUrl = `${serverBase}/api/${userId || '{userid}'}/${apiKey || '{apikey}'}/chat`;
  const headerEndpointUrl = `${serverBase}/api/${userId || '{userid}'}/chat`;

  const curlSnippet = `curl -X POST "${directEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What is the admission procedure?",
    "k": 4
  }'`;

  return (
    <div className="dashboard-page-container api-keys-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">RAG Service</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">API Keys</span>
          </div>
          <h1 className="header-page-title">Connect Your Applications.</h1>
          <p className="header-page-subtitle">Instant RAG API endpoints ready for custom chatbots and external platforms.</p>
        </div>

        <div className="header-right">
          <a
            href="https://raas.bemylove.in/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div className="live-pill" style={{ cursor: 'pointer' }}>
              <ExternalLink size={14} className="text-indigo" />
              <span>Interactive API Docs</span>
            </div>
          </a>
        </div>
      </header>

      <div className="dashboard-vertical-sections">
        {/* Top Section: Active API Key Card */}
        <section className="dashboard-section api-key-top-card" aria-label="API Key Details">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <Key size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Your Active Secret API Key</h2>
                <p className="section-subtext">
                  Authenticate your custom chatbot against your vector-indexed documents.
                </p>
              </div>
            </div>

            <Badge variant="success" size="md" dot>
              {loading ? 'Fetching Key...' : 'Active Production Key'}
            </Badge>
          </div>

          <div className="api-key-box">
            <div className="api-key-value-wrap">
              <span className="api-key-prefix">Key</span>
              <span className="api-key-code">
                {loading ? 'Loading key...' : apiKey || 'Click Generate to create a key'}
              </span>
            </div>

            <div className="api-key-actions">
              <Button
                variant="outline"
                size="sm"
                icon={copiedKey ? Check : Copy}
                onClick={handleCopyKey}
                disabled={!apiKey}
              >
                {copiedKey ? 'Copied' : 'Copy Key'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={handleRegenerate}
                className={regenerating ? 'rotating' : ''}
                disabled={regenerating}
              >
                {regenerating ? 'Generating...' : apiKey ? 'Rotate Key' : 'Generate API Key'}
              </Button>
            </div>
          </div>

          <div className="key-scopes-row">
            <div className="scope-tag">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Scope: rag.chat (Semantic Search + LLM Answer)</span>
            </div>
            <div className="scope-tag">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Tenant: Isolated to user {userId?.slice(-6) || 'active'}</span>
            </div>
            <div className="scope-tag">
              <Lock size={14} className="text-indigo" />
              <span>Rate Limit: 60 req/min</span>
            </div>
          </div>
        </section>

        {/* Middle Section: Live RAG Endpoints */}
        <section className="dashboard-section" aria-label="Live Endpoints">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <Globe size={20} className="section-icon text-cyan" />
              </div>
              <div>
                <h2 className="section-heading">Your Dedicated RAG Chatbot Endpoints</h2>
                <p className="section-subtext">
                  Share these URLs with developers or paste them into chatbot widgets.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {/* Turnkey Endpoint (Key in URL) */}
            <div style={{ background: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#34d399' }}>
                  Direct URL Endpoint (Key in path — Turnkey & No-Code)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(directEndpointUrl)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: '#e5e7eb',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
                  {copiedUrl ? 'Copied' : 'Copy URL'}
                </button>
              </div>
              <code style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
                POST {directEndpointUrl}
              </code>
            </div>

            {/* Standard Header Endpoint */}
            <div style={{ background: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd' }}>
                  Standard REST Endpoint (Key via x-api-key header)
                </span>
              </div>
              <code style={{ color: '#e5e7eb', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
                POST {headerEndpointUrl}
              </code>
            </div>
          </div>
        </section>

        {/* Bottom Section: cURL Quick Start */}
        <section className="dashboard-section api-integration-card" aria-label="API Integration Guide">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge requests-badge">
                <Terminal size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Quick Start cURL Test</h2>
                <p className="section-subtext">
                  Copy and run this command in your terminal to test your RAG chatbot right now
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={copiedCurl ? Check : Copy}
              onClick={() => handleCopyCurl(curlSnippet)}
            >
              {copiedCurl ? 'Copied' : 'Copy cURL'}
            </Button>
          </div>

          <div className="curl-code-block">
            <pre className="code-snippet">
              {curlSnippet}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ApiKeys;
