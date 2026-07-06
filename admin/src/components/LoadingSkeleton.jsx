import React from 'react';

const SkeletonBox = ({ className = '' }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />
);

export const DashboardSkeleton = () => (
    <div className="min-h-screen bg-[#f7faf8] p-8">
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="mt-4 h-10 w-16" />
                    </div>
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SkeletonBox className="h-6 w-40" />
                    <div className="mt-4 space-y-3">
                        <SkeletonBox className="h-20 w-full" />
                        <SkeletonBox className="h-20 w-full" />
                    </div>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SkeletonBox className="h-6 w-32" />
                    <div className="mt-4 space-y-3">
                        <SkeletonBox className="h-14 w-full" />
                        <SkeletonBox className="h-14 w-full" />
                        <SkeletonBox className="h-14 w-full" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);
