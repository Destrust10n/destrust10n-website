import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Unlock, RefreshCw, CheckCircle, Eye, XCircle,
  Clock, Mail, DollarSign, Calendar, AlertCircle, ArrowLeft, Send,
  Sliders, Filter, Search, ChevronRight
} from 'lucide-react';

interface StoredInquiry {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  project_type?: string;
  projectType?: string;
  budget: string;
  description: string;
  status: 'new' | 'reviewed' | 'closed';
  reviewed_at?: string;
  closed_at?: string;
  ip_hash?: string;
}

interface AvailabilityData {
  available: boolean;
  statusText: string;
  supportingText: string;
  dateKolkata: string;
  timezone: string;
  closedCountToday: number;
  overrideMode: 'auto' | 'force_available' | 'force_unavailable';
}

interface AdminDashboardProps {
  onClose?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('d10_admin_token') || sessionStorage.getItem('d10_admin_token');
    }
    return null;
  });

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [inquiries, setInquiries] = useState<StoredInquiry[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<StoredInquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'reviewed' | 'closed'>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fetch inquiries and availability
  const loadDashboardData = async () => {
    if (!token) return;
    setLoadingData(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/admin?action=inquiries', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        const json = await res.json();
        setInquiries(json.inquiries || []);
        if (json.availability) {
          setAvailability(json.availability);
        }
      }
    } catch (err) {
      console.error('[Admin] Failed to load inquiries:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed.');
      }

      setToken(data.token);
      sessionStorage.setItem('d10_admin_token', data.token);
      setPassword('');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    localStorage.removeItem('d10_admin_token');
    sessionStorage.removeItem('d10_admin_token');
    setInquiries([]);
    setSelectedInquiry(null);
  };

  // Status update handler (mark reviewed or closed)
  const handleStatusUpdate = async (inquiryId: string, status: 'reviewed' | 'closed') => {
    if (!token) return;

    try {
      const res = await fetch('/api/admin?action=update_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inquiryId, status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(
          status === 'closed'
            ? `Inquiry marked as Closed. Today's availability automatically updated to UNAVAILABLE (One Day, One Work active).`
            : `Inquiry marked as Reviewed.`
        );

        // Update local inquiry list
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq))
        );

        if (selectedInquiry?.id === inquiryId) {
          setSelectedInquiry((prev) => (prev ? { ...prev, status } : null));
        }

        if (data.availability) {
          setAvailability(data.availability);
        }

        // Emit public event so availability badges on page update immediately
        window.dispatchEvent(new Event('availability-updated'));
      }
    } catch (err) {
      console.error('[Admin] Error updating status:', err);
    }
  };

  // Override availability handler
  const handleOverride = async (overrideMode: 'auto' | 'force_available' | 'force_unavailable') => {
    if (!token) return;

    try {
      const res = await fetch('/api/admin?action=override_availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ overrideMode, reason: 'Manually toggled from Admin Dashboard' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAvailability(data.availability);
        setActionMessage(`Daily availability override set to: ${overrideMode.toUpperCase()}`);
        window.dispatchEvent(new Event('availability-updated'));
      }
    } catch (err) {
      console.error('[Admin] Override failed:', err);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterStatus === 'all') return true;
    return inq.status === filterStatus;
  });

  const countNew = inquiries.filter((i) => i.status === 'new').length;
  const countReviewed = inquiries.filter((i) => i.status === 'reviewed').length;
  const countClosed = inquiries.filter((i) => i.status === 'closed').length;

  // View: Login Screen
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/90 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="relative w-full max-w-md p-8 rounded-3xl glass-panel border border-[#00E5FF]/30 shadow-[0_24px_64px_rgba(0,0,0,0.9)]">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full text-[#929AA5] hover:text-[#F5F7FA] hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#101318] border border-[#00E5FF]/40 flex items-center justify-center mb-4 box-cyan-glow">
              <Lock className="w-7 h-7 text-[#00E5FF]" />
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-[#F5F7FA]">
              Studio Control Hub
            </h3>
            <p className="text-xs font-mono text-[#929AA5] mt-1 tracking-wider uppercase">
              DESTRUST10N // Internal Operations
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                Administrative Secret Key
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password or secret..."
                className="w-full px-4 py-3 rounded-xl bg-[#050608] border border-white/10 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs font-mono text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl font-bold text-sm glass-btn-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#050608]" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-[#050608]" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] font-mono text-center text-[#929AA5] mt-6">
            🔒 Protected by cryptographic token verification & serverless authorization.
          </p>
        </div>
      </div>
    );
  }

  // View: Main Admin Dashboard
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050608] text-[#F5F7FA] overflow-y-auto">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#101318]/90 backdrop-blur-xl border-b border-[#00E5FF]/20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#929AA5] hover:text-[#F5F7FA] hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Studio</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-lg tracking-wider text-[#F5F7FA]">
              DESTRUST<span className="text-[#00E5FF]">10</span>N
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
              OPERATIONS HUB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loadingData}
            className="p-2 rounded-xl glass-panel-subtle text-[#929AA5] hover:text-[#00E5FF] transition-colors"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-[#00E5FF]' : ''}`} />
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8">

        {/* Banner: Action Feedback */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs font-mono text-[#00E5FF] flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-[#929AA5] hover:text-white">✕</button>
          </div>
        )}

        {/* Section 1: "ONE DAY, ONE WORK" Daily Availability Controller */}
        <section className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#00E5FF]">
                  ONE DAY // ONE WORK CONTROLLER
                </span>
                <span className="text-[11px] font-mono text-[#929AA5] bg-white/5 px-2 py-0.5 rounded">
                  Asia/Kolkata (IST: UTC+5:30)
                </span>
              </div>

              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F5F7FA] flex items-center gap-3">
                <span>Public Availability:</span>
                <span className={availability?.available ? 'text-emerald-400' : 'text-amber-400'}>
                  {availability?.statusText || 'Available for Work'}
                </span>
              </h2>

              <p className="text-sm text-[#929AA5] mt-1 max-w-2xl">
                {availability?.supportingText} Today's closed project count: <strong>{availability?.closedCountToday || 0}</strong> / 1 max.
              </p>
            </div>

            {/* Availability Mode Controls */}
            <div className="flex flex-wrap items-center gap-2 bg-[#050608]/60 p-2 rounded-2xl border border-white/10">
              <button
                onClick={() => handleOverride('auto')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  availability?.overrideMode === 'auto'
                    ? 'bg-[#00E5FF] text-[#050608] font-bold shadow-[0_0_12px_#00E5FF]'
                    : 'text-[#929AA5] hover:text-white'
                }`}
              >
                Auto (1-Work Daily Rule)
              </button>

              <button
                onClick={() => handleOverride('force_available')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  availability?.overrideMode === 'force_available'
                    ? 'bg-emerald-400 text-[#050608] font-bold shadow-[0_0_12px_#10B981]'
                    : 'text-[#929AA5] hover:text-white'
                }`}
              >
                Force Available
              </button>

              <button
                onClick={() => handleOverride('force_unavailable')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  availability?.overrideMode === 'force_unavailable'
                    ? 'bg-amber-400 text-[#050608] font-bold shadow-[0_0_12px_#F59E0B]'
                    : 'text-[#929AA5] hover:text-white'
                }`}
              >
                Force Unavailable
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Metric Overview Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/5">
            <span className="text-[11px] font-mono text-[#929AA5] uppercase tracking-wider">Total Received</span>
            <p className="font-heading font-extrabold text-3xl text-[#F5F7FA] mt-1">{inquiries.length}</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20">
            <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider">New (Unreviewed)</span>
            <p className="font-heading font-extrabold text-3xl text-[#00E5FF] mt-1">{countNew}</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5">
            <span className="text-[11px] font-mono text-[#929AA5] uppercase tracking-wider">Under Review</span>
            <p className="font-heading font-extrabold text-3xl text-zinc-300 mt-1">{countReviewed}</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-amber-500/20">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Closed (Accepted)</span>
            <p className="font-heading font-extrabold text-3xl text-amber-400 mt-1">{countClosed}</p>
          </div>
        </section>

        {/* Section 3: Inquiries Table & Filtering */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-xl text-[#F5F7FA]">
                Project Inquiries
              </h3>
              <span className="text-xs font-mono text-[#929AA5]">({filteredInquiries.length})</span>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-[#101318] border border-white/10 self-start sm:self-auto">
              {(['all', 'new', 'reviewed', 'closed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                    filterStatus === tab
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF] font-bold'
                      : 'text-[#929AA5] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredInquiries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-white/5">
              <Mail className="w-8 h-8 text-[#929AA5] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[#929AA5]">No inquiries found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredInquiries.map((inq) => {
                const projectTypeStr = inq.project_type || inq.projectType || 'Project Inquiry';
                const formattedDate = new Date(inq.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-[#00E5FF]/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status indicator dot */}
                      <span
                        className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          inq.status === 'new'
                            ? 'bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]'
                            : inq.status === 'reviewed'
                            ? 'bg-zinc-400'
                            : 'bg-amber-400'
                        }`}
                      />

                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="font-bold text-base text-[#F5F7FA] group-hover:text-[#00E5FF] transition-colors">
                            {inq.name}
                          </h4>
                          <span className="text-xs font-mono text-[#929AA5]">{inq.email}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                            {projectTypeStr}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF]">
                            {inq.budget}
                          </span>
                        </div>

                        <p className="text-xs text-[#929AA5] mt-1.5 line-clamp-1 max-w-2xl">
                          {inq.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      <span className="text-xs font-mono text-[#929AA5] whitespace-nowrap">
                        {formattedDate}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#929AA5] group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal: Full Inquiry Details & Operations */}
        {selectedInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-[#00E5FF]/30 p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-[#00E5FF] tracking-wider uppercase">
                    INQUIRY // {selectedInquiry.id}
                  </span>
                  <h3 className="font-heading font-extrabold text-2xl text-[#F5F7FA] mt-1">
                    {selectedInquiry.name}
                  </h3>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re:%20DESTRUST10N%20Project%20Inquiry%20[${selectedInquiry.id}]`}
                    className="text-sm font-mono text-[#00E5FF] hover:underline"
                  >
                    {selectedInquiry.email}
                  </a>
                </div>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="p-2 rounded-xl text-[#929AA5] hover:text-white hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Inquiry Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#050608] border border-white/10 text-xs font-mono">
                <div>
                  <span className="text-[#929AA5] uppercase text-[10px]">Project Scope:</span>
                  <p className="text-[#F5F7FA] font-medium mt-0.5">{selectedInquiry.project_type || selectedInquiry.projectType}</p>
                </div>
                <div>
                  <span className="text-[#929AA5] uppercase text-[10px]">Budget Allocated:</span>
                  <p className="text-[#00E5FF] font-medium mt-0.5">{selectedInquiry.budget}</p>
                </div>
                <div>
                  <span className="text-[#929AA5] uppercase text-[10px]">Current Status:</span>
                  <p className="text-amber-400 uppercase font-bold mt-0.5">{selectedInquiry.status}</p>
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#929AA5] mb-2">
                  Client Project Requirements:
                </label>
                <div className="p-4 rounded-2xl bg-[#050608]/80 border border-white/10 text-sm text-[#F5F7FA] leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re:%20DESTRUST10N%20Project%20Inquiry%20[${selectedInquiry.id}]`}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold glass-btn-primary flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>

                <div className="flex items-center gap-2">
                  {selectedInquiry.status !== 'reviewed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedInquiry.id, 'reviewed')}
                      className="px-4 py-2.5 rounded-xl text-xs font-mono text-[#F5F7FA] bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      Mark Reviewed
                    </button>
                  )}

                  {selectedInquiry.status !== 'closed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedInquiry.id, 'closed')}
                      className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors"
                    >
                      Close & Accept Today's Slot
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
