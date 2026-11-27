export default function Pagination({ page, totalPages, totalElements, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs font-medium text-gray-500">
        Trang <span className="font-bold text-[#262626]">{page + 1}</span> / {totalPages}{' '}
        {typeof totalElements === 'number' && `(Tổng ${totalElements} món ăn)`}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border border-[#F4E5D7] bg-white px-3.5 py-2 text-xs font-bold text-[#262626] transition hover:border-[#F47721] hover:text-[#F47721] disabled:cursor-not-allowed disabled:opacity-45"
        >
          ← Trước
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-[36px] rounded-xl px-2.5 text-xs font-bold transition ${
              p === page
                ? 'bg-[#F47721] text-white shadow-sm'
                : 'border border-[#F4E5D7] bg-white text-[#262626] hover:border-[#F47721] hover:text-[#F47721]'
            }`}
          >
            {p + 1}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl border border-[#F4E5D7] bg-white px-3.5 py-2 text-xs font-bold text-[#262626] transition hover:border-[#F47721] hover:text-[#F47721] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
