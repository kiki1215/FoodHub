export default function ConfirmModal({
  open,
  title = 'Xác nhận thao tác',
  message,
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy',
  danger = true,
  loading = false,
  errorMessage = '',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !loading && onCancel?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-extrabold text-[#262626]">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{message}</p>

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#F47721] hover:bg-[#E06510]'
            }`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
