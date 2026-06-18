import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PO_STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'PARTIALLY_RECEIVED', label: 'Partial' },
  { key: 'RECEIVED', label: 'Received' },
] as const;

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  PARTIALLY_RECEIVED: 2,
  RECEIVED: 3,
  CANCELLED: -1,
};

interface StatusTimelineProps {
  status: string;
  className?: string;
}

export function POStatusTimeline({ status, className }: StatusTimelineProps) {
  if (status === 'CANCELLED') {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3', className)}>
        <Circle className="h-4 w-4 text-destructive fill-destructive" />
        <span className="text-sm font-medium text-destructive">This purchase order has been cancelled</span>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER[status] ?? 0;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {PO_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-primary/10 text-primary',
                  isUpcoming && 'border-muted-foreground/30 text-muted-foreground/50',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-foreground',
                  isUpcoming && 'text-muted-foreground/50',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < PO_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-3 mt-[-18px] rounded-full',
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HealthScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive';
  const strokeColor = score >= 80 ? 'stroke-success' : score >= 60 ? 'stroke-warning' : 'stroke-destructive';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/30" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700', strokeColor)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', color)}>{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}
