export default function ProductSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col rounded-2xl border border-[#F4E5D7]/60 bg-white p-3 shadow-card"
        >
          <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-[#F4E5D7]/70" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[#F4E5D7]/80" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-[#F4E5D7]/60" />
          <div className="mt-3 h-8 w-full animate-pulse rounded-xl bg-[#F4E5D7]/70" />
        </div>
      ))}
    </div>
  );
}
