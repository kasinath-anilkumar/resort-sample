const SkeletonBox = ({ className = '' }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />
);

export const RoomsGridSkeleton = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <SkeletonBox className="h-52 w-full" />
                <div className="mt-4 space-y-3">
                    <SkeletonBox className="h-5 w-2/3" />
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-5/6" />
                    <div className="flex items-center justify-between pt-2">
                        <SkeletonBox className="h-8 w-20" />
                        <SkeletonBox className="h-10 w-24 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const HomeRoomsSkeleton = ({ count = 4 }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <SkeletonBox className="h-44 w-full" />
                <div className="mt-4 space-y-3">
                    <SkeletonBox className="h-5 w-3/4" />
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-10 w-24 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

export const PackageCardsSkeleton = ({ count = 3 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <SkeletonBox className="h-56 w-full" />
                <div className="mt-4 space-y-3">
                    <SkeletonBox className="h-6 w-2/3" />
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-5/6" />
                    <div className="flex items-center justify-between pt-3">
                        <SkeletonBox className="h-8 w-20" />
                        <SkeletonBox className="h-10 w-28 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const RoomDetailsSkeleton = () => (
    <div className="min-h-screen bg-[#f7faf8] mt-20 px-4 py-8 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-8">
            <SkeletonBox className="h-[420px] w-full rounded-[32px]" />
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                    <SkeletonBox className="h-8 w-2/3" />
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-5/6" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <SkeletonBox key={index} className="h-20 w-full" />
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <SkeletonBox className="h-8 w-1/2" />
                    <div className="mt-4 space-y-3">
                        <SkeletonBox className="h-12 w-full" />
                        <SkeletonBox className="h-12 w-full" />
                        <SkeletonBox className="h-14 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    </div>
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
