import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  size?: 'default' | 'compact';
}

export function EmptyState({ icon: Icon, title, description, action, className, size = 'default' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', size === 'default' ? 'py-20' : 'py-12', className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/5 scale-150" />
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 border border-primary/10">
          <Icon className="h-8 w-8 text-primary/70" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="shadow-sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
