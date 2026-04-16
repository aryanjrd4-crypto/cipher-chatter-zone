import { Skeleton } from '@/components/ui/skeleton';

export function PostSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex gap-3 items-center">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-4 pt-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
