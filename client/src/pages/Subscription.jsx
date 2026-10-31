import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Mail,
  Building,
  FileText,
  Activity
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { apiService } from '../services/api';

export function Subscription() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);

  const [currentSub, setCurrentSub] = useState({
    plan: 'Free',
    status: 'active',
    billingCycle: 'monthly',
    renewsOn: 'Never (Free Tier)',
    documentLimit: 2,
    documentsUsed: 0,
    requestLimit: 100,
    requestsUsed: 0
  });

  const [stripeCustomerId, setStripeCustomerId] = useState(null);

  // Load current subscription and verify Stripe session if redirected from checkout
  useEffect(() => {
    async function initSubscription() {
      setLoading(true);

      const sessionId = searchParams.get('session_id');
      const isSuccess = searchParams.get('success');
      const isCanceled = searchParams.get('canceled');

      // 1. Handle Stripe checkout return
      if (sessionId && isSuccess) {
        try {
          const verifyRes = await apiService.verifyCheckoutSession(sessionId);
          if (verifyRes?.success) {
            setMessage(verifyRes.message || 'Payment confirmed! Your subscription is now active.');
            setIsError(false);
          }
        } catch (err) {
          setMessage(err.response?.data?.message || 'Failed to verify checkout session.');
          setIsError(true);
        }
      } else if (isCanceled) {
        setMessage('Stripe checkout was canceled. No charges were processed.');
        setIsError(false);
      }

      // 2. Fetch fresh subscription data
      try {
        const subData = await apiService.getSubscription();
        if (subData?.subscription) {
          setCurrentSub(subData.subscription);
          if (subData.subscription.stripeCustomerId) {
            setStripeCustomerId(subData.subscription.stripeCustomerId);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    }

    initSubscription();
  }, [searchParams]);

  // Handle plan checkout or downgrade
  const handleSelectPlan = async (planKey) => {
    setMessage('');
    setIsError(false);

    if (planKey === 'enterprise') {
      setShowEnterpriseModal(true);
      return;
    }

    if (planKey === 'free') {
      if (currentSub.plan === 'Free') {
        setMessage('You are already on the Free Plan.');
        return;
      }
      try {
        setActionLoading(true);
        const res = await apiService.switchToFreePlan();
        if (res?.success) {
          setCurrentSub(res.subscription);
          setMessage('Successfully switched to the Free Plan.');
          setIsError(false);
        }
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to switch to Free Plan.');
        setIsError(true);
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // Paid Plan: Create Stripe Checkout Session
    try {
      setActionLoading(true);
      const res = await apiService.createCheckoutSession(planKey);
      if (res?.url) {
        // Redirect directly to Stripe hosted checkout
        window.location.href = res.url;
      } else {
        setMessage('Unable to initiate Stripe checkout. Please try again.');
        setIsError(true);
        setActionLoading(false);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to start Stripe checkout session.');
      setIsError(true);
      setActionLoading(false);
    }
  };

  // Open Stripe Customer Portal
  const handleOpenPortal = async () => {
    try {
      setActionLoading(true);
      const res = await apiService.openCustomerPortal();
      if (res?.url) {
        window.location.href = res.url;
      } else {
        setMessage('Customer portal is not available at this moment.');
        setIsError(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to open customer billing portal.');
      setIsError(true);
    } finally {
      setActionLoading(false);
    }
  };

  const documentPercent = Math.min(
    100,
    Math.round(((currentSub?.documentsUsed || 0) / (currentSub?.documentLimit || 2)) * 100)
  );

  const requestPercent = Math.min(
    100,
    Math.round(((currentSub?.requestsUsed || 0) / (currentSub?.requestLimit || 100)) * 100)
  );

  const isCurrent = (planName) => {
    if (!currentSub?.plan) return planName.toLowerCase() === 'free';
    const cur = currentSub.plan.toLowerCase().trim();
    const target = planName.toLowerCase().trim();
    return cur === target || cur.startsWith(target) || target.startsWith(cur);
  };

  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">RAG Service</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Subscription</span>
          </div>
          <h1 className="header-page-title">Manage Your Subscription.</h1>
          <p className="header-page-subtitle">
            Scale your document ingestion capacity and API quotas with transparent monthly billing in INR.
          </p>
        </div>
        <div className="header-right">
          <Button
            variant="outline"
            icon={ExternalLink}
            onClick={handleOpenPortal}
            disabled={actionLoading || currentSub?.plan === 'Free'}
            title={currentSub?.plan === 'Free' ? 'Subscribe to a paid plan to manage billing via Stripe' : 'Manage invoices and card on Stripe'}
          >
            Manage Billing & Invoices
          </Button>
        </div>
      </header>

      {/* Status Notifications */}
      {message && (
        <div className={`subscription-banner ${isError ? 'banner-error' : 'banner-success'}`}>
          {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{message}</span>
        </div>
      )}

      {/* Current Subscription & Usage Quota Overview */}
      <section className="dashboard-section current-sub-overview">
        <div className="section-header">
          <div className="section-title-wrapper">
            <div className="section-icon-badge">
              <CreditCard size={20} className="section-icon text-indigo" />
            </div>
            <div>
              <h2 className="section-heading">Active Plan & Resource Quotas</h2>
              <p className="section-subtext">Live backend-enforced limits for your organisation.</p>
            </div>
          </div>
          <Badge variant={currentSub.status === 'active' ? 'success' : 'warning'}>
            {currentSub.status?.toUpperCase()}
          </Badge>
        </div>

        <div className="sub-metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Current Plan</span>
            <span className="metric-value">{currentSub.plan}</span>
            <span className="metric-desc">Billed {currentSub.billingCycle} in INR</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Renewal / Reset Date</span>
            <span className="metric-value text-sm">{currentSub.renewsOn}</span>
            <span className="metric-desc">Automatic monthly quota renewal</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Document Upload Quota</span>
            <div className="metric-meter">
              <div className="meter-header">
                <span className="meter-count">
                  {currentSub.documentsUsed || 0} / {currentSub.documentLimit || 2} documents
                </span>
                <span className="meter-pct">{documentPercent}%</span>
              </div>
              <div className="meter-track">
                <div
                  className={`meter-bar ${documentPercent >= 100 ? 'meter-danger' : ''}`}
                  style={{ width: `${documentPercent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-label">API Requests Quota</span>
            <div className="metric-meter">
              <div className="meter-header">
                <span className="meter-count">
                  {(currentSub.requestsUsed || 0).toLocaleString()} / {(currentSub.requestLimit || 100).toLocaleString()} requests
                </span>
                <span className="meter-pct">{requestPercent}%</span>
              </div>
              <div className="meter-track">
                <div
                  className={`meter-bar ${requestPercent >= 100 ? 'meter-danger' : ''}`}
                  style={{ width: `${requestPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Grid */}
      <section className="dashboard-section plans-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <div className="section-icon-badge">
              <Zap size={20} className="section-icon text-indigo" />
            </div>
            <div>
              <h2 className="section-heading">Available Subscription Plans</h2>
              <p className="section-subtext">Select the tier tailored to your document and request volume.</p>
            </div>
          </div>
        </div>

        <div className="pricing-grid-4">
          {/* 1. Free Plan */}
          <div className={`plan-card ${isCurrent('Free') ? 'plan-active' : ''}`}>
            <div className="plan-header">
              <span className="plan-name">Free</span>
              {isCurrent('Free') && <span className="active-tag">Current Plan</span>}
            </div>
            <div className="plan-price">
              <span className="price-amount">₹0</span>
              <span className="price-interval">/ month</span>
            </div>
            <p className="plan-description">
              Get started with lightweight RAG prototyping and document experimentation.
            </p>
            <div className="plan-limits-badge">
              <span className="limit-item"><FileText size={14} /> 2 documents</span>
              <span className="limit-item"><Activity size={14} /> 100 API requests / mo</span>
            </div>
            <ul className="plan-features">
              <li><Check size={16} className="text-success" /> Maximum 2 uploaded documents</li>
              <li><Check size={16} className="text-success" /> 100 API requests / month</li>
              <li><Check size={16} className="text-success" /> Standard vector indexing</li>
              <li><Check size={16} className="text-success" /> Community support</li>
            </ul>
            <div className="plan-action">
              {isCurrent('Free') ? (
                <Button variant="outline" disabled fullWidth>Active Plan</Button>
              ) : (
                <Button
                  variant="outline"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => handleSelectPlan('free')}
                >
                  Downgrade to Free
                </Button>
              )}
            </div>
          </div>

          {/* 2. Starter Plan */}
          <div className={`plan-card popular-card ${isCurrent('Starter') ? 'plan-active' : ''}`}>
            <div className="popular-badge">Most Popular</div>
            <div className="plan-header">
              <span className="plan-name">Starter</span>
              {isCurrent('Starter') && <span className="active-tag">Current Plan</span>}
            </div>
            <div className="plan-price">
              <span className="price-amount">₹499</span>
              <span className="price-interval">/ month</span>
            </div>
            <p className="plan-description">
              Ideal for small teams and products integrating automated document QA.
            </p>
            <div className="plan-limits-badge">
              <span className="limit-item"><FileText size={14} /> 5 documents</span>
              <span className="limit-item"><Activity size={14} /> 1,000 API requests / mo</span>
            </div>
            <ul className="plan-features">
              <li><Check size={16} className="text-success" /> Up to 5 uploaded documents</li>
              <li><Check size={16} className="text-success" /> 1,000 API requests / month</li>
              <li><Check size={16} className="text-success" /> Priority embedding pipeline</li>
              <li><Check size={16} className="text-success" /> High-throughput vector search</li>
              <li><Check size={16} className="text-success" /> Standard email support</li>
            </ul>
            <div className="plan-action">
              {isCurrent('Starter') ? (
                <Button variant="outline" disabled fullWidth>Active Plan</Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => handleSelectPlan('starter')}
                >
                  Upgrade with Stripe
                </Button>
              )}
            </div>
          </div>

          {/* 3. Pro Plan */}
          <div className={`plan-card ${isCurrent('Pro') ? 'plan-active' : ''}`}>
            <div className="plan-header">
              <span className="plan-name">Pro</span>
              {isCurrent('Pro') && <span className="active-tag">Current Plan</span>}
            </div>
            <div className="plan-price">
              <span className="price-amount">₹999</span>
              <span className="price-interval">/ month</span>
            </div>
            <p className="plan-description">
              For scaling applications requiring higher document capacity and heavy query traffic.
            </p>
            <div className="plan-limits-badge">
              <span className="limit-item"><FileText size={14} /> 12 documents</span>
              <span className="limit-item"><Activity size={14} /> 2,500 API requests / mo</span>
            </div>
            <ul className="plan-features">
              <li><Check size={16} className="text-success" /> Up to 12 uploaded documents</li>
              <li><Check size={16} className="text-success" /> 2,500 API requests / month</li>
              <li><Check size={16} className="text-success" /> Dedicated vector indexing</li>
              <li><Check size={16} className="text-success" /> Custom chunking parameters</li>
              <li><Check size={16} className="text-success" /> Priority email support</li>
            </ul>
            <div className="plan-action">
              {isCurrent('Pro') ? (
                <Button variant="outline" disabled fullWidth>Active Plan</Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => handleSelectPlan('pro')}
                >
                  Upgrade with Stripe
                </Button>
              )}
            </div>
          </div>

          {/* 4. Enterprise Plan */}
          <div className={`plan-card enterprise-card ${isCurrent('Enterprise') ? 'plan-active' : ''}`}>
            <div className="plan-header">
              <span className="plan-name">Enterprise</span>
              {isCurrent('Enterprise') && <span className="active-tag">Current Plan</span>}
            </div>
            <div className="plan-price">
              <span className="price-amount">Custom</span>
              <span className="price-interval">/ bespoke</span>
            </div>
            <p className="plan-description">
              Custom limits, SLAs, and dedicated compute for organizations with custom needs.
            </p>
            <div className="plan-limits-badge">
              <span className="limit-item"><Building size={14} /> Custom documents</span>
              <span className="limit-item"><Activity size={14} /> Custom API requests</span>
            </div>
            <ul className="plan-features">
              <li><Check size={16} className="text-success" /> Custom document upload capacity</li>
              <li><Check size={16} className="text-success" /> Custom API request quotas</li>
              <li><Check size={16} className="text-success" /> Dedicated vector indexing & SLAs</li>
              <li><Check size={16} className="text-success" /> Dedicated support manager</li>
              <li><Check size={16} className="text-success" /> Custom chunking & fine-tuning</li>
            </ul>
            <div className="plan-action">
              <Button
                variant="outline"
                fullWidth
                disabled={actionLoading}
                onClick={() => handleSelectPlan('enterprise')}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Contact Modal */}
      {showEnterpriseModal && (
        <div className="modal-backdrop">
          <div className="modal-content enterprise-modal">
            <div className="modal-header">
              <h3 className="modal-title">Contact Enterprise Sales</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowEnterpriseModal(false);
                  setEnterpriseSubmitted(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {enterpriseSubmitted ? (
                <div className="enterprise-success">
                  <CheckCircle2 size={40} className="text-success" />
                  <h4>Inquiry Received</h4>
                  <p>Our enterprise solutions team will contact your organisation within 24 hours.</p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowEnterpriseModal(false);
                      setEnterpriseSubmitted(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setEnterpriseSubmitted(true);
                  }}
                  className="enterprise-form"
                >
                  <p className="modal-instruction">
                    Provide your document volume and query requirements, and we'll configure your custom limits.
                  </p>
                  <div className="form-group">
                    <label>Organisation Name</label>
                    <input type="text" required placeholder="Acme Corp" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Work Email</label>
                    <input type="email" required placeholder="you@acme.com" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Estimated Monthly Document Count</label>
                    <input type="number" min="15" placeholder="e.g. 50" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Estimated Monthly API Requests</label>
                    <input type="number" min="5000" placeholder="e.g. 25000" className="form-input" />
                  </div>
                  <div className="modal-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEnterpriseModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Submit Request
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security and Stripe badge footer */}
      <footer className="subscription-footer">
        <ShieldCheck size={18} className="text-indigo" />
        <span>
          Payments processed securely through Stripe with 256-bit TLS encryption. Card details are never stored on our servers.
        </span>
      </footer>
    </div>
  );
}

export default Subscription;
