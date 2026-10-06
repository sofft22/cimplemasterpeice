export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header bar skeleton */}
      <div className="border-b border-[#e5e5e5]">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:h-[68px] sm:px-6 lg:px-10">
          <div className="h-4 w-32 skeleton sm:w-40" />
          <div className="hidden gap-8 sm:flex">
            <div className="h-3 w-16 skeleton" />
            <div className="h-3 w-20 skeleton" />
            <div className="h-3 w-16 skeleton" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full skeleton" />
            <div className="h-8 w-8 rounded-full skeleton" />
          </div>
        </div>
      </div>

      {/* Hero band skeleton */}
      <div className="mx-auto max-w-7xl px-5 pt-8 pb-6 sm:px-8 lg:px-10">
        <div className="h-12 w-full rounded skeleton" />
      </div>

      {/* Content grid skeleton */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[4/5] w-full skeleton" />
              <div className="mt-2.5 h-3 w-3/4 skeleton" />
              <div className="mt-1 h-3 w-1/3 skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}