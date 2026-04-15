import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 flex-1" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
