import React, { useState, useEffect } from 'react';
import {
  User,
  Key,
  Lock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { apiService } from '../services/api';

export function Settings() {
  // 1. Logged-in Email state
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // 2. Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 3. Subscription Plan state
  const [subscription, setSubscription] = useState({
    plan: 'Developer Pro',
    status: 'active',
    billingCycle: 'monthly',
    renewsOn: 'November 30, 2026',
    requestLimit: 50000,
    tokenLimit: 2000000,
    requestsUsed: 142,
    tokensUsed: 48500
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Developer Pro');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');

  // Fetch actual authenticated user email from Clerk (or backend fallback)
  useEffect(() => {
    async function loadUserData() {
      setAuthLoading(true);

      // 1. Check Clerk user if available in window.Clerk
      let resolvedEmail = '';
      if (typeof window !== 'undefined' && window.Clerk?.user) {
        resolvedEmail =
          window.Clerk.user.primaryEmailAddress?.emailAddress ||
          window.Clerk.user.emailAddresses?.[0]?.emailAddress ||
          '';
      }

      // 2. If not found in Clerk, fetch actual authenticated user from backend / localStorage
      if (!resolvedEmail) {
        try {
          const profile = await apiService.getMe();
          if (profile?.user?.email) {
            resolvedEmail = profile.user.email;
          }
        } catch (_) {
          // Handled below
        }
      }

      if (!resolvedEmail) {
        resolvedEmail = localStorage.getItem('rag_user_email') || 'developer@organization.io';
      }

      setEmail(resolvedEmail);
      setAuthLoading(false);
    }

    async function loadSubscriptionData() {
      setSubscriptionLoading(true);
      try {
        const res = await apiService.getSubscription();
        if (res?.subscription) {
          setSubscription(res.subscription);
          setSelectedPlan(res.subscription.plan || 'Developer Pro');
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setSubscriptionLoading(false);
      }
    }

    loadUserData();
    loadSubscriptionData();
  }, []);

  // Handle Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation 1: Check all fields are provided
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setPasswordError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    // Validation 2: Validate that both new password fields match
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    // Validation 3: Ensure new password is not identical to current
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      // 1. Update password securely using Clerk if Clerk user instance is present
      if (typeof window !== 'undefined' && window.Clerk?.user?.updatePassword) {
        await window.Clerk.user.updatePassword({
          currentPassword,
          newPassword
        });
      }

      // 2. Update password via backend authentication integration (verifies current password against database)
      const res = await apiService.changePassword(currentPassword, newPassword);

      if (res?.success) {
        setPasswordSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res?.message || 'Failed to update password. Please verify your current password.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to verify current password or update password.';
      setPasswordError(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Subscription Plan Upgrade / Management
  const handleUpgradePlan = async (tierKey) => {
    setUpgradeLoading(true);
    setSubscriptionMessage('');

    try {
      if (tierKey === 'free' || tierKey === 'Free Plan') {
        const res = await apiService.switchToFreePlan();
        if (res?.success && res.subscription) {
          setSubscription(res.subscription);
          setSelectedPlan(res.subscription.plan);
          setShowPlanSwitcher(false);
          setSubscriptionMessage('Switched to Free Plan successfully.');
          setTimeout(() => setSubscriptionMessage(''), 4000);
        }
      } else {
        // Stripe checkout for paid plans
        const res = await apiService.createCheckoutSession(tierKey);
        if (res?.success && res.url) {
          window.location.href = res.url;
        } else {
          setSubscriptionMessage(res?.message || 'Failed to initialize Stripe checkout.');
        }
      }
    } catch (err) {
      setSubscriptionMessage(err.response?.data?.message || err.message || 'Failed to update subscription.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Calculate percentage used
  const requestPct = Math.min(
    100,
    Math.round(((subscription.requestsUsed || 0) / (subscription.requestLimit || 1)) * 100)
  );
  const tokenPct = Math.min(
    100,
    Math.round(((subscription.tokensUsed || 0) / (subscription.tokenLimit || 1)) * 100)
  );

  return (
    <div className="dashboard-page-container">
      {/* Page Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">RAG Service</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Settings</span>
          </div>
          <h1 className="header-page-title">Workspace Settings</h1>
          <p className="header-page-subtitle">Manage your account and preferences.</p>
        </div>

        <div className="header-right">
          <div className="live-pill">
            <span className="live-dot" />
            <span>Account Active</span>
          </div>
        </div>
      </header>

      <div className="dashboard-vertical-sections">
        {/* =================================================================
            1. LOGGED-IN EMAIL (Read-only, fetched from Clerk / Auth profile)
           ================================================================= */}
        <section className="dashboard-section" aria-label="Account Details">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <User size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Account Profile</h2>
                <p className="section-subtext">Verified credentials and identity</p>
              </div>
            </div>
            <Badge variant="success" size="md" dot>
              Authenticated
            </Badge>
          </div>

          <div className="settings-section-body">
            <div className="settings-field-group">
              <label className="settings-label" htmlFor="user-email">
                Logged-in Email
              </label>
              <div className="settings-input-wrap">
                <input
                  id="user-email"
                  type="email"
                  value={authLoading ? 'Loading email...' : email}
                  readOnly
                  disabled
                  className="settings-input settings-input-readonly"
                  aria-readonly="true"
                />
                <Badge variant="indigo" size="sm">
                  Read-only
                </Badge>
              </div>
              <span className="settings-help-text">
                Your authenticated account email address. Managed through identity provider.
              </span>
            </div>
          </div>
        </section>

        {/* =================================================================
            2. CHANGE PASSWORD (Current password verification, match validation)
           ================================================================= */}
        <section className="dashboard-section" aria-label="Change Password">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <Key size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Change Password</h2>
                <p className="section-subtext">Update your account authentication password securely</p>
              </div>
            </div>
          </div>

          <div className="settings-section-body">
            {passwordError && (
              <div className="settings-alert settings-alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="settings-alert settings-alert-success" role="status">
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="settings-password-form">
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="current-password">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="settings-input"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="settings-field-group">
                <label className="settings-label" htmlFor="new-password">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div className="settings-field-group">
                <label className="settings-label" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="settings-input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div style={{ marginTop: '8px' }}>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={passwordLoading}
                  icon={passwordLoading ? RefreshCw : ShieldCheck}
                  className={passwordLoading ? 'rotating' : ''}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* =================================================================
            3. SUBSCRIPTION PLAN (Actual plan, limits, usage, upgrade action)
           ================================================================= */}
        <section className="dashboard-section" aria-label="Subscription Plan">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <CreditCard size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <h2 className="section-heading">Subscription Plan</h2>
                <p className="section-subtext">Active tier, quota limits, and billing metrics</p>
              </div>
            </div>

            <Badge variant="indigo" size="md">
              {subscription.status ? `${subscription.status.toUpperCase()}` : 'ACTIVE'}
            </Badge>
          </div>

          <div className="settings-section-body">
            {subscriptionMessage && (
              <div className="settings-alert settings-alert-success">
                <CheckCircle2 size={16} />
                <span>{subscriptionMessage}</span>
              </div>
            )}

            <div className="settings-plan-overview">
              {/* Current Plan Overview Card */}
              <div className="settings-plan-card">
                <div className="settings-plan-info">
                  <div className="settings-plan-name-row">
                    <span className="settings-plan-title">{subscription.plan}</span>
                    <Badge variant="success" size="sm" dot>
                      {subscription.status}
                    </Badge>
                  </div>
                  <span className="settings-plan-meta">
                    Billing cycle: {subscription.billingCycle} • Renews on {subscription.renewsOn}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowUpRight}
                  onClick={() => setShowPlanSwitcher(!showPlanSwitcher)}
                >
                  {showPlanSwitcher ? 'Hide Plans' : 'Upgrade Plan'}
                </Button>
              </div>

              {/* Usage Against Plan Limits */}
              <div className="settings-usage-grid">
                {/* Monthly API Requests Meter */}
                <div className="settings-usage-card">
                  <div className="settings-usage-header">
                    <span className="settings-usage-title">API Requests</span>
                    <span className="settings-usage-pct">{requestPct}%</span>
                  </div>
                  <div className="settings-usage-values">
                    <span className="settings-usage-used">
                      {(subscription.requestsUsed || 0).toLocaleString()}
                    </span>
                    <span className="settings-usage-limit">
                      / {(subscription.requestLimit || 100).toLocaleString()} requests
                    </span>
                  </div>
                  <div className="settings-progress-track">
                    <div
                      className="settings-progress-bar"
                      style={{ width: `${Math.max(2, requestPct)}%` }}
                    />
                  </div>
                  <span className="settings-help-text">
                    {Math.max(0, (subscription.requestLimit || 100) - (subscription.requestsUsed || 0)).toLocaleString()} requests remaining in billing period
                  </span>
                </div>

                {/* Document Upload Quota Meter */}
                <div className="settings-usage-card">
                  <div className="settings-usage-header">
                    <span className="settings-usage-title">Document Storage</span>
                    <span className="settings-usage-pct">
                      {Math.min(100, Math.round(((subscription.documentsUsed || 0) / (subscription.documentLimit || 2)) * 100))}%
                    </span>
                  </div>
                  <div className="settings-usage-values">
                    <span className="settings-usage-used">
                      {(subscription.documentsUsed || 0).toLocaleString()}
                    </span>
                    <span className="settings-usage-limit">
                      / {(subscription.documentLimit || 2).toLocaleString()} documents
                    </span>
                  </div>
                  <div className="settings-progress-track">
                    <div
                      className="settings-progress-bar"
                      style={{
                        width: `${Math.max(2, Math.min(100, Math.round(((subscription.documentsUsed || 0) / (subscription.documentLimit || 2)) * 100)))}%`
                      }}
                    />
                  </div>
                  <span className="settings-help-text">
                    {Math.max(0, (subscription.documentLimit || 2) - (subscription.documentsUsed || 0))} document upload slots remaining
                  </span>
                </div>
              </div>

              {/* Interactive Upgrade / Tier Switcher */}
              {showPlanSwitcher && (
                <div className="settings-tier-selector-modal">
                  {/* Free Plan */}
                  <div
                    className={`settings-tier-card ${subscription.plan.toLowerCase() === 'free' ? 'selected' : ''}`}
                  >
                    <span className="settings-tier-title">Free</span>
                    <span className="settings-tier-price">₹0/mo</span>
                    <span className="settings-tier-limits">
                      • 2 documents<br />
                      • 100 API requests/month<br />
                      • Standard vector indexing
                    </span>
                    <Button
                      variant={subscription.plan.toLowerCase() === 'free' ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={subscription.plan.toLowerCase() === 'free' || upgradeLoading}
                      onClick={() => handleUpgradePlan('free')}
                    >
                      {subscription.plan.toLowerCase() === 'free' ? 'Current Plan' : 'Select Free'}
                    </Button>
                  </div>

                  {/* Starter Tier */}
                  <div
                    className={`settings-tier-card ${subscription.plan.toLowerCase() === 'starter' ? 'selected' : ''}`}
                  >
                    <span className="settings-tier-title">Starter</span>
                    <span className="settings-tier-price">₹499/mo</span>
                    <span className="settings-tier-limits">
                      • 5 documents<br />
                      • 1,000 API requests/month<br />
                      • Priority vector pipeline
                    </span>
                    <Button
                      variant={subscription.plan.toLowerCase() === 'starter' ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={subscription.plan.toLowerCase() === 'starter' || upgradeLoading}
                      onClick={() => handleUpgradePlan('starter')}
                    >
                      {subscription.plan.toLowerCase() === 'starter' ? 'Current Plan' : 'Upgrade with Stripe'}
                    </Button>
                  </div>

                  {/* Pro Tier */}
                  <div
                    className={`settings-tier-card ${subscription.plan.toLowerCase() === 'pro' ? 'selected' : ''}`}
                  >
                    <span className="settings-tier-title">Pro</span>
                    <span className="settings-tier-price">₹999/mo</span>
                    <span className="settings-tier-limits">
                      • 12 documents<br />
                      • 2,500 API requests/month<br />
                      • Dedicated vector index
                    </span>
                    <Button
                      variant={subscription.plan.toLowerCase() === 'pro' ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={subscription.plan.toLowerCase() === 'pro' || upgradeLoading}
                      onClick={() => handleUpgradePlan('pro')}
                    >
                      {subscription.plan.toLowerCase() === 'pro' ? 'Current Plan' : 'Upgrade with Stripe'}
                    </Button>
                  </div>

                  {/* Enterprise Tier */}
                  <div
                    className={`settings-tier-card ${subscription.plan.toLowerCase() === 'enterprise' ? 'selected' : ''}`}
                  >
                    <span className="settings-tier-title">Enterprise</span>
                    <span className="settings-tier-price">Custom</span>
                    <span className="settings-tier-limits">
                      • Custom documents<br />
                      • Custom API requests<br />
                      • Dedicated SLAs &amp; 24/7 support
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { window.location.href = '/subscription'; }}
                    >
                      Contact Us
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
