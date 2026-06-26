import { cn } from '../../lib/utils';

export default function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-6 w-full animate-pulse", className)}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="rounded-full bg-charcoal-600 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-charcoal-600 rounded w-3/4"></div>
          <div className="h-3 bg-charcoal-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-2 bg-charcoal-600 rounded w-full"></div>
        <div className="h-2 bg-charcoal-600 rounded w-5/6"></div>
      </div>
    </div>
  );
}
