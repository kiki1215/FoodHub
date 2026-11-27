import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FoodImage from '../components/common/FoodImage';
import { CartIcon, TrashIcon } from '../components/common/Icons';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { formatCurrencyVnd } from '../utils/formatters';

const SAMPLE_VOUCHERS = [
  { code: 'FOODHUB10', label: 'FOODHUB10 (-10%)' },
  { code: 'GIAM15K', label: 'GIAM15K (-15k từ 80k)' },
  { code: 'GIAM30K', label: 'GIAM30K (-30k từ 150k)' },
];

export default function CartPage() {
  const {
    items,
    totalItems,
    totalQuantity,
    totalAmount,
    appliedVoucher,
    loadingCart,
    updatingProductId,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearAllCart,
    applyVoucher,
    clearVoucher,
  } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [voucherInput, setVoucherInput] = useState(appliedVoucher?.code || '');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const handleIncrease = async (item) => {
    try {
      await increaseQuantity(item.productId);
    } catch (err) {
      toast.error(err?.message || 'Không thể tăng số lượng món.');
    }
  };

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) return;
    try {
      await decreaseQuantity(item.productId);
    } catch (err) {
      toast.error(err?.message || 'Không thể giảm số lượng món.');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeFromCart(item.productId);
      toast.success(`Đã xóa "${item.productName}" khỏi giỏ hàng.`);
    } catch (err) {
      toast.error(err?.message || 'Không thể xóa món khỏi giỏ hàng.');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ món trong giỏ hàng?')) return;
    try {
      await clearAllCart();
      setVoucherInput('');
      toast.success('Đã làm trống giỏ hàng.');
    } catch (err) {
      toast.error(err?.message || 'Không thể xóa giỏ hàng.');
    }
  };

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    const trimmed = voucherInput.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập mã giảm giá.');
      return;
    }
    setApplyingVoucher(true);
    try {
      const res = await applyVoucher(trimmed);
      setVoucherInput(res.code);
      toast.success(`Đã áp dụng mã ${res.code}: ${res.description}!`);
    } catch (err) {
      toast.error(err?.message || 'Mã giảm giá không hợp lệ.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  if (loadingCart && items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-80 animate-pulse rounded-2xl bg-white p-6 shadow-card lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-2xl bg-white p-6 shadow-card lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-card sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF8F0] text-[#F47721]">
            <CartIcon className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold uppercase text-[#262626]">
            Giỏ hàng của bạn đang trống
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hãy chọn ngay những món ăn nóng hổi yêu thích từ thực đơn FOODHUB nhé!
          </p>
          <Link to="/products" className="fh-btn-primary mt-6">
            Khám phá thực đơn ngay
          </Link>
        </div>
      </section>
    );
  }

  const discountAmount = Number(appliedVoucher?.discountAmount || 0);
  const finalAmount = Math.max(0, Number(totalAmount || 0) - discountAmount);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Cột trái: Danh sách món ăn bám sát cart.png */}
        <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8 lg:col-span-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-4">
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#262626] sm:text-2xl">
              GIỎ HÀNG CỦA BẠN{' '}
              <span className="text-base font-medium normal-case text-gray-500">
                ({totalItems} sản phẩm)
              </span>
            </h1>

            <button
              type="button"
              onClick={handleClearCart}
              className="text-xs font-semibold text-gray-500 transition hover:text-red-600"
            >
              Xóa toàn bộ giỏ
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const busy = updatingProductId === item.productId;
              return (
                <div
                  key={item.productId}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3.5 sm:max-w-[52%]">
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#262626] text-xs font-bold text-white"
                    >
                      ✓
                    </span>

                    <Link
                      to={`/products/${item.productId}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#F4E5D7] bg-[#FFF8F0]"
                    >
                      <FoodImage
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="h-full w-full"
                      />
                    </Link>

                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.productId}`}
                        className="line-clamp-2 text-sm font-bold text-[#262626] transition hover:text-[#F47721] sm:text-base"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">Đơn giá món</p>
                      <p className="mt-0.5 text-sm font-extrabold text-[#262626]">
                        {formatCurrencyVnd(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
                    <div className="inline-flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => handleDecrease(item)}
                        title={
                          item.quantity <= 1
                            ? 'Bấm biểu tượng thùng rác để xóa món'
                            : 'Giảm số lượng'
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47721] text-base font-bold text-white transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="min-w-[26px] text-center text-sm font-bold text-[#262626]">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={busy || item.quantity >= 99}
                        onClick={() => handleIncrease(item)}
                        title="Tăng số lượng"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47721] text-base font-bold text-white transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <p className="min-w-[96px] text-right text-sm font-extrabold text-[#262626] sm:text-base">
                      {formatCurrencyVnd(item.subtotal)}
                    </p>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRemove(item)}
                      aria-label={`Xóa ${item.productName}`}
                      title="Xóa khỏi giỏ hàng"
                      className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-5">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F47721] transition hover:underline"
            >
              <span>←</span> Tiếp tục chọn món
            </Link>
          </div>
        </div>

        {/* Cột phải: Tóm tắt đơn hàng + Ô nhập mã giảm giá bám sát cart.png */}
        <aside className="sticky top-24 rounded-2xl bg-white p-6 shadow-card sm:p-7 lg:col-span-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#262626]">
            TÓM TẮT ĐƠN HÀNG
          </h2>

          {/* Khung nhập mã khuyến mãi bám sát cart.png */}
          <form onSubmit={handleApplyVoucher} className="mt-4 flex gap-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              placeholder="Nhập mã giảm giá..."
              className="fh-input flex-1 py-2.5 text-sm uppercase placeholder:normal-case"
            />
            <button
              type="submit"
              disabled={applyingVoucher}
              className="shrink-0 rounded-xl bg-[#F47721] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#E06510] disabled:opacity-60"
            >
              {applyingVoucher ? '...' : 'Áp dụng'}
            </button>
          </form>

          {/* Gợi ý nhanh mã khuyến mãi có sẵn */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SAMPLE_VOUCHERS.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => setVoucherInput(v.code)}
                className="rounded-lg border border-dashed border-[#F47721]/40 bg-[#FFF8F0] px-2 py-0.5 text-[11px] font-semibold text-[#F47721] transition hover:border-[#F47721]"
              >
                {v.label}
              </button>
            ))}
          </div>

          {appliedVoucher && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <span>
                Đã áp dụng <strong>{appliedVoucher.code}</strong> ({appliedVoucher.description})
              </span>
              <button
                type="button"
                onClick={() => {
                  clearVoucher();
                  setVoucherInput('');
                }}
                className="ml-2 font-bold text-red-500 hover:underline"
              >
                Bỏ mã
              </button>
            </div>
          )}

          <div className="mt-5 space-y-3 border-y border-gray-100 py-4 text-sm">
            <div className="flex items-center justify-between text-gray-600">
              <span>Tạm tính ({totalQuantity} phần)</span>
              <span className="font-semibold text-[#262626]">{formatCurrencyVnd(totalAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Giảm giá</span>
              <span className="font-bold text-emerald-600">
                {discountAmount > 0 ? `-${formatCurrencyVnd(discountAmount)}` : '0 đ'}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Phí giao hàng dự kiến</span>
              <span className="font-semibold text-[#262626]">0 đ</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-base font-extrabold text-[#262626]">Tổng cộng</span>
            <span className="text-2xl font-extrabold text-[#F47721]">
              {formatCurrencyVnd(finalAmount)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="fh-btn-primary mt-6 w-full py-3.5 uppercase tracking-wide"
          >
            TIẾN HÀNH ĐẶT HÀNG
          </button>
        </aside>
      </div>
    </section>
  );
}
