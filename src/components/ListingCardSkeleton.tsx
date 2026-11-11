/**
 * The one loading placeholder for the listing grid.
 *
 * Rendered by HomePage, FavoritesPage (, MyListingsPage) while listings load.
 * Matches DESIGN.md section 6 "Loading State" and mirrors ListingCard's real
 * proportions (4:3 photo, 2-line title, agent footer) so the swap to content
 * does not shift the layout.
 */
interface ListingCardSkeletonProps {
  /** Render the agent row. Omit where the real card has no footer. */
  showFooter?: boolean
}

export function ListingCardSkeleton({ showFooter = true }: ListingCardSkeletonProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        {showFooter && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
          </div>
        )}
      </div>
    </div>
  )
}

interface ListingGridSkeletonProps {
  count?: number
  /** Wrapper classes; each page keeps its own grid text (aria-label / role). */
  className?: string
  showFooter?: boolean
}

/** Convenience grid of skeletons for the "while loading" branch. */
export function ListingGridSkeleton({
  count = 6,
  className = 'mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
  showFooter = true,
}: ListingGridSkeletonProps) {
  return (
    <div className={className} aria-label="Memuat properti" role="status">
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} showFooter={showFooter} />
      ))}
    </div>
  )
}

interface ListingRowSkeletonProps {
  count?: number
  className?: string
}

/**
 * List-row variant (not cards) for MyListingsPage, whose real rows are a
 * 220px photo beside text inside a grid.
 */
export function ListingRowSkeleton({ count = 3, className = '' }: ListingRowSkeletonProps) {
  return (
    <div className={'space-y-4 ' + className} aria-label="Memuat iklan" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  )
}

