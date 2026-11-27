export default function AiRecommendationPlaceholder({
  title = 'Món ngon dành riêng cho bạn',
  compact = false,
}) {
  const itemCount = compact ? 4 : 4;

  return (
    <section
      aria-label={title}
      className={compact ? 'mt-7' : 'mt-9'}
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2
          className={`flex items-center gap-2 font-extrabold text-[#262626] ${
            compact ? 'text-base sm:text-lg' : 'text-lg uppercase'
          }`}
        >
          <span className="text-[#F47721]" aria-hidden="true">
            ✨
          </span>
          <span>{title}</span>
        </h2>
        <span className="rounded-full border border-[#F47721]/30 bg-white px-3 py-1 text-[11px] font-semibold text-[#F47721]">
          AI Gợi ý cá nhân hóa • Đang chờ tích hợp AI Service
        </span>
      </div>

      <div
        className={
          compact
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
            : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'
        }
      >
        {Array.from({ length: itemCount }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl border border-dashed border-[#F47721]/35 bg-white/85 p-3 shadow-sm"
          >
            <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-gradient-to-r from-[#F4E5D7]/60 via-[#FFF8F0] to-[#F4E5D7]/60" />
            <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded bg-[#F4E5D7]" />
            <div className="mt-2 h-3.5 w-2/5 animate-pulse rounded bg-[#F47721]/25" />
            {!compact && (
              <div className="mt-3 h-8 w-full animate-pulse rounded-xl bg-[#F47721]/20" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
