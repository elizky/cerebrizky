import { statusLabel } from '@/lib/copy';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<string, { color: string; pulse?: boolean }> = {
  inbox: { color: '#ef4444' },
  todo: { color: '#fbbf24' },
  to_read: { color: '#fbbf24' },
  wishlist: { color: '#fbbf24' },
  to_listen: { color: '#fbbf24' },
  paused: { color: '#fbbf24' },
  doing: { color: '#34d399', pulse: true },
  active: { color: '#34d399', pulse: true },
  reading: { color: '#34d399', pulse: true },
  playing: { color: '#34d399', pulse: true },
  listening: { color: '#34d399', pulse: true },
  done: { color: '#38bdf8' },
};

type StatusDotProps = {
  status: string;
  className?: string;
};

export function StatusDot({ status, className }: StatusDotProps) {
  const style = STATUS_DOT[status] ?? { color: '#a3a3a3' };
  const label = statusLabel(status);

  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className={cn(
        'inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-black/25',
        style.pulse && 'animate-pulse',
        className,
      )}
      style={{ backgroundColor: style.color }}
    />
  );
}
