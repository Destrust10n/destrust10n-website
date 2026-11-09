import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface AvailabilityData {
  available: boolean;
  statusText: string;
  supportingText: string;
  dateKolkata: string;
  timezone: string;
  closedCountToday: number;
  overrideMode: string;
}

interface AvailabilityIndicatorProps {
  variant?: 'compact' | 'detailed' | 'pill';
  className?: string;
}

export const AvailabilityIndicator: React.FC<AvailabilityIndicatorProps> = ({
  variant = 'detailed',
  className = '',
}) => {
  const [data, setData] = useState<AvailabilityData>({
    available: true,
    statusText: 'Available for Work',
    supportingText: 'Currently accepting one project today.',
    dateKolkata: '',
    timezone: 'Asia/Kolkata',
    closedCountToday: 0,
    overrideMode: 'auto',
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAvailability = async () => {
    try {
      const res = await fetch('/api/availability', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Fallback stays available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // Poll every 60 seconds so status dynamically updates
    const interval = setInterval(fetchAvailability, 60000);
    window.addEventListener('availability-updated', fetchAvailability);

    return () => {
      clearInterval(interval);
      window.removeEventListener('availability-updated', fetchAvailability);
    };
  }, []);

  // Variant: Pill (Compact for Navbar / Headers)
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 ${
          data.available
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-zinc-800/60 text-[#929AA5] border border-white/10'
        } ${className}`}
        title={data.supportingText}
      >
        <span className="relative flex h-2 w-2">
          {data.available && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              data.available ? 'bg-emerald-400' : 'bg-zinc-500'
            }`}
          />
        </span>
        <span className="font-semibold tracking-wide">
          {data.available ? 'Available for Work' : 'Currently Unavailable'}
        </span>
      </div>
    );
  }

  // Variant: Compact (Badge)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs font-mono ${className}`}>
        <span className="relative flex h-2.5 w-2.5">
          {data.available && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${data.available ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
        </span>
        <span className={data.available ? 'text-emerald-400 font-semibold' : 'text-[#929AA5]'}>
          {data.statusText}
        </span>
      </div>
    );
  }

  // Variant: Detailed (Hero / Contact / Main showcase)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-panel p-5 sm:p-6 transition-all duration-500 border ${
        data.available
          ? 'border-emerald-500/30 shadow-[0_12px_32px_rgba(16,185,129,0.12)]'
          : 'border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
      } ${className}`}
    >
      {/* Background Accent Glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          data.available ? 'bg-emerald-500/15' : 'bg-zinc-700/15'
        }`}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Status Indicator Disc */}
          <div className="relative mt-1 sm:mt-0 flex-shrink-0">
            <span className="relative flex h-4 w-4">
              {data.available && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 border-2 border-[#050608] shadow-md ${
                  data.available ? 'bg-emerald-400 shadow-[0_0_12px_#10B981]' : 'bg-zinc-500'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-bold text-base sm:text-lg text-[#F5F7FA]">
                {data.statusText}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/5 text-[#929AA5] border border-white/10">
                1 Day // 1 Work
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#929AA5] mt-0.5 leading-relaxed">
              {data.supportingText}
            </p>
          </div>
        </div>

        {/* Studio Timezone Context */}
        <div className="flex items-center gap-3 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:border-l sm:pl-5 border-white/10 flex-shrink-0">
          <div className="flex flex-col text-left sm:text-right">
            <span className="text-[10px] font-mono text-[#929AA5] uppercase tracking-wider flex items-center sm:justify-end gap-1">
              <Clock className="w-3 h-3 text-[#00E5FF]" />
              <span>IST Cycle (UTC+5:30)</span>
            </span>
            <span className="text-xs font-mono text-[#F5F7FA] mt-0.5">
              {data.dateKolkata || 'Asia/Kolkata'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
