import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export function ApiKeys() {
  const [apiKey, setApiKey] = useState('rag_live_9f83a4c0172e90b84d2891f7a8');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      const newKey = `rag_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newKey);
      setRegenerating(false);
    }, 600);
  };

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
          <p className="header-page-subtitle">Secure API access to your knowledge base.</p>
        </div>

        <div className="header-right">
          <div className="live-pill">
            <span className="live-dot" />
            <span>SSL / TLS Encrypted</span>
          </div>
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
                <h2 className="section-heading">Connect Your Applications.</h2>
                <p className="section-subtext">
                  Secure API access to your knowledge base.
                </p>
              </div>
            </div>

            <Badge variant="success" size="md" dot>
              Active Production Key
            </Badge>
          </div>

          <div className="api-key-box">
            <div className="api-key-value-wrap">
              <span className="api-key-prefix">Bearer</span>
              <span className="api-key-code">{apiKey}</span>
            </div>

            <div className="api-key-actions">
              <Button
                variant="outline"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy Key'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={handleRegenerate}
                className={regenerating ? 'rotating' : ''}
              >
                {regenerating ? 'Generating...' : 'Generate API Key'}
              </Button>
            </div>
          </div>

          <div className="key-scopes-row">
            <div className="scope-tag">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Scope: rag.query (Read)</span>
            </div>
            <div className="scope-tag">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Scope: rag.ingest (Write)</span>
            </div>
            <div className="scope-tag">
              <Lock size={14} className="text-indigo" />
              <span>Rate Limit: 60 req/min</span>
            </div>
          </div>
        </section>

        {/* Bottom Section: Integration Example */}
        <section className="dashboard-section api-integration-card" aria-label="API Integration Guide">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge requests-badge">
                <Terminal size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Quick Start cURL Endpoint</h2>
                <p className="section-subtext">
                  Send questions to your vector store and receive synthesized answers
                </p>
              </div>
            </div>
          </div>

          <div className="curl-code-block">
            <pre className="code-snippet">
{`curl -X POST https://api.ragplatform.io/v1/query \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What is the attendance policy?",
    "top_k": 3,
    "temperature": 0.2
  }'`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ApiKeys;
