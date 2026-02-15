import React from 'react';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse rounded-md bg-neutral-200/80 ${className}`}
            {...props}
        />
    );
};

export const SkeletonCard = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
    </div>
);

export const SkeletonList = () => (
    <div className="space-y-4">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 border p-4 rounded-xl">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonGrid = ({ count = 8 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
        {Array(count).fill(0).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export const SkeletonDetails = () => (
    <div className="space-y-8 animate-pulse">
        {/* Title & Image Skeleton */}
        <div className="space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
            <div className="h-[400px] bg-neutral-200 rounded-2xl w-full"></div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
                <div className="h-20 bg-neutral-200 rounded-xl w-full"></div>
                <div className="h-40 bg-neutral-200 rounded-xl w-full"></div>
                <div className="h-60 bg-neutral-200 rounded-xl w-full"></div>
            </div>
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block h-[400px] bg-neutral-200 rounded-xl w-full sticky top-28"></div>
        </div>
    </div>
);

export default Skeleton;
