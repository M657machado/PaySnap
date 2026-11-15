import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { Language } from '../lib/finance';
import { COPY } from '../lib/i18n';

export function OfflineIndicator({ lang }: { lang: Language }) {
  const isOnline = useOnlineStatus();
  const t = COPY[lang];

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
      <span>{t.offlineBadge}</span>
    </div>
  );
}
