function renderCategoryIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('cơm')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 12H20C19.5 17 16.2 20 12 20C7.8 20 4.5 17 4 12Z" />
        <path d="M7 10C8.5 7.5 10.5 7 12 8.5C13.5 7 15.5 7.5 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (lower.includes('phở') || lower.includes('mì') || lower.includes('bún')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 13H20C19.4 17.6 16.1 20 12 20C7.9 20 4.6 17.6 4 13Z" />
        <path d="M8 4L19 2M8 7L19 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 6V12M12 6V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (lower.includes('nhanh')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 11C4 7.5 7.5 5 11.5 5C15.5 5 19 7.5 19 11H4Z" />
        <rect x="3.5" y="12.5" width="16" height="2.2" rx="1.1" />
        <path d="M4.5 16.2H18.5C18.5 18.3 16.8 19.5 14.5 19.5H8.5C6.2 19.5 4.5 18.3 4.5 16.2Z" />
      </svg>
    );
  }
  if (lower.includes('vặt')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 10H18L16.5 20H7.5L6 10Z" />
        <path d="M8 5V9M11 4V9M14 5V9M16.5 6V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (lower.includes('tráng miệng')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 13C5 9.7 8.1 7 12 7C15.9 7 19 9.7 19 13H5Z" />
        <rect x="4" y="14.5" width="16" height="5" rx="2" />
        <circle cx="12" cy="5" r="1.8" />
      </svg>
    );
  }
  if (lower.includes('uống')) {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 8H17L15.6 20H8.4L7 8Z" />
        <path d="M6 6.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 6L15 3H17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <circle cx="8" cy="16" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

export default function CategoryBar({ categories = [], selectedCategoryId, onSelectCategory, loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-5 py-2 sm:gap-8">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 animate-pulse rounded-full bg-[#F4E5D7]" />
            <div className="h-3 w-14 animate-pulse rounded bg-[#F4E5D7]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-1 sm:gap-7">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className="group flex flex-col items-center gap-2 focus:outline-none"
      >
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white transition duration-150 ${
            !selectedCategoryId
              ? 'border-[#F47721] text-[#F47721] shadow-md'
              : 'border-transparent text-[#F47721] shadow-sm group-hover:-translate-y-0.5 group-hover:border-[#F47721]/50'
          }`}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
          </svg>
        </span>
        <span
          className={`text-xs font-bold transition ${
            !selectedCategoryId ? 'text-[#F47721]' : 'text-[#262626] group-hover:text-[#F47721]'
          }`}
        >
          Tất cả
        </span>
      </button>

      {categories.map((cat) => {
        const active = Number(selectedCategoryId) === Number(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white transition duration-150 ${
                active
                  ? 'border-[#F47721] text-[#F47721] shadow-md'
                  : 'border-transparent text-[#F47721] shadow-sm group-hover:-translate-y-0.5 group-hover:border-[#F47721]/50'
              }`}
            >
              {renderCategoryIcon(cat.name)}
            </span>
            <span
              className={`text-xs font-bold transition ${
                active ? 'text-[#F47721]' : 'text-[#262626] group-hover:text-[#F47721]'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
