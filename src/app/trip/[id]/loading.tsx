export default function TripLoading() {
  return (
    <main className="min-h-screen bg-cream-100">
      {/* Hero Skeleton */}
      <div className="relative w-full min-h-[50vh] bg-gradient-to-br from-charcoal-900 via-charcoal-900/95 to-charcoal-800 flex items-end overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 pb-12 pt-32">
          <div className="h-3 w-28 bg-white/10 rounded-full mb-5 animate-pulse" />
          <div className="h-12 w-96 max-w-full bg-white/10 rounded-lg mb-3 animate-pulse" />
          <div className="h-12 w-64 max-w-full bg-white/10 rounded-lg mb-8 animate-pulse" />
          <div className="flex gap-4 mb-8">
            <div className="h-6 w-40 bg-white/10 rounded-full animate-pulse" />
            <div className="h-6 w-28 bg-white/10 rounded-full animate-pulse" />
            <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
            <div className="h-10 w-20 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {[1, 2, 3].map((day) => (
              <div key={day}>
                {/* Day header */}
                <div className="mb-8">
                  <div className="h-3 w-32 bg-terracotta-500/20 rounded-full mb-2 animate-pulse" />
                  <div className="h-10 w-24 bg-charcoal-900/10 rounded-lg mb-2 animate-pulse" />
                  <div className="h-4 w-56 bg-charcoal-900/5 rounded-full mb-4 animate-pulse" />
                  <div className="w-16 h-0.5 bg-terracotta-500/20 animate-pulse" />
                </div>

                {/* Time block label */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-amber-500/15 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-charcoal-900/10 rounded-full animate-pulse" />
                </div>

                {/* Activity cards */}
                {[1, 2].map((card) => (
                  <div
                    key={card}
                    className="flex gap-4 p-4 rounded-xl bg-white border border-cream-200 mb-3"
                  >
                    <div className="shrink-0">
                      <div className="h-6 w-14 bg-cream-100 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-charcoal-900/10 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-full bg-charcoal-900/5 rounded mb-1.5 animate-pulse" />
                      <div className="h-3 w-3/4 bg-charcoal-900/5 rounded mb-3 animate-pulse" />
                      <div className="h-4 w-16 bg-charcoal-900/5 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}

                {/* Afternoon block */}
                <div className="flex items-center gap-2 mb-4 mt-8">
                  <div className="w-5 h-5 bg-terracotta-400/15 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-charcoal-900/10 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-4 p-4 rounded-xl bg-white border border-cream-200 mb-3">
                  <div className="shrink-0">
                    <div className="h-6 w-14 bg-cream-100 rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-charcoal-900/10 rounded mb-2 animate-pulse" />
                    <div className="h-3 w-full bg-charcoal-900/5 rounded mb-1.5 animate-pulse" />
                    <div className="h-3 w-2/3 bg-charcoal-900/5 rounded mb-3 animate-pulse" />
                    <div className="h-4 w-20 bg-charcoal-900/5 rounded-full animate-pulse" />
                  </div>
                </div>

                {day < 3 && (
                  <div className="mt-12 pt-8 border-t border-cream-200" />
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <div className="bg-cream-50 rounded-2xl border border-cream-200 p-5">
              <div className="h-7 w-32 bg-charcoal-900/10 rounded mb-2 animate-pulse" />
              <div className="h-4 w-56 bg-charcoal-900/5 rounded-full mb-6 animate-pulse" />

              {/* Flights section */}
              <div className="border-b border-cream-200 pb-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 bg-terracotta-500/20 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-charcoal-900/10 rounded animate-pulse" />
                </div>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border border-cream-200 mb-3"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-28 bg-charcoal-900/10 rounded animate-pulse" />
                      <div className="h-5 w-14 bg-terracotta-500/15 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-40 bg-charcoal-900/5 rounded mb-3 animate-pulse" />
                    <div className="h-9 w-full bg-terracotta-500/15 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Hotels section */}
              <div className="pb-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 bg-terracotta-500/20 rounded animate-pulse" />
                  <div className="h-5 w-14 bg-charcoal-900/10 rounded animate-pulse" />
                </div>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border border-cream-200 mb-3"
                  >
                    <div className="h-5 w-36 bg-charcoal-900/10 rounded mb-2 animate-pulse" />
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className="w-3.5 h-3.5 bg-amber-400/20 rounded animate-pulse"
                        />
                      ))}
                    </div>
                    <div className="h-3 w-24 bg-charcoal-900/5 rounded mb-3 animate-pulse" />
                    <div className="h-9 w-full bg-terracotta-500/15 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
