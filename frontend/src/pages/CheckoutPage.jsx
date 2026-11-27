import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useLocation, useNavigate } from 'react-router-dom';
import FoodImage from '../components/common/FoodImage';
import { CheckCircleIcon, LocationIcon } from '../components/common/Icons';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';
import { formatCurrencyVnd, isValidVietnamPhone } from '../utils/formatters';

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `fh-${crypto.randomUUID()}`;
  }
  return `fh-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const {
    items: cartItems,
    totalAmount: cartTotalAmount,
    appliedVoucher: cartVoucher,
    fetchCart,
    clearVoucher,
  } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Nếu đi từ nút "ĐẶT HÀNG" ở trang Chi tiết món ăn: đặt thẳng món này, KHÔNG qua giỏ hàng
  const directItem = location.state?.directItem || null;
  const isDirectBuyNow = Boolean(directItem);

  const checkoutItems = useMemo(
    () => (isDirectBuyNow ? [directItem] : cartItems),
    [isDirectBuyNow, directItem, cartItems]
  );

  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    shippingAddress: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Khuyến mãi (kế thừa từ Giỏ hàng hoặc nhập trực tiếp tại Checkout)
  const [voucherInput, setVoucherInput] = useState(cartVoucher?.code || '');
  const [activeVoucher, setActiveVoucher] = useState(isDirectBuyNow ? null : cartVoucher);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Đối chiếu giá & tình trạng món ăn trực tiếp với Menu Service
  const [verifying, setVerifying] = useState(true);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [priceChanges, setPriceChanges] = useState([]);
  const [verifiedSubtotal, setVerifiedSubtotal] = useState(null);
  const [confirmPriceChange, setConfirmPriceChange] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quản lý Idempotency-Key chống tạo đơn trùng
  const idempotencyRef = useRef({ key: '', fingerprint: '' });
  // Đánh dấu đã đặt hàng thành công để không bật hộp thoại xác nhận thoát khi chuyển trang
  const orderCompletedRef = useRef(false);

  // Chặn điều hướng rời khỏi màn hình đặt hàng khi đơn chưa được xác nhận
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !orderCompletedRef.current &&
      checkoutItems.length > 0 &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Cảnh báo nếu người dùng đóng tab / F5 khi đang ở màn hình đặt hàng
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!orderCompletedRef.current && checkoutItems.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [checkoutItems.length]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        receiverName: prev.receiverName || user.fullName || '',
        receiverPhone: prev.receiverPhone || user.phone || '',
        shippingAddress: prev.shippingAddress || user.address || '',
        note: prev.note || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!isDirectBuyNow) {
      setActiveVoucher(cartVoucher);
      if (cartVoucher?.code) setVoucherInput(cartVoucher.code);
    }
  }, [isDirectBuyNow, cartVoucher]);

  const verifyItemsWithBackend = useCallback(async () => {
    setVerifying(true);
    setUnavailableItems([]);
    try {
      let sourceItems = [];
      if (isDirectBuyNow && directItem) {
        sourceItems = [directItem];
      } else {
        const latestCart = await fetchCart();
        sourceItems = latestCart?.items || [];
      }

      if (sourceItems.length === 0) {
        setVerifiedSubtotal(0);
        return;
      }

      const checks = await Promise.all(
        sourceItems.map(async (ci) => {
          try {
            const res = await menuService.getProductById(ci.productId);
            return { item: ci, product: res?.data || null };
          } catch {
            return { item: ci, product: null };
          }
        })
      );

      const unavail = [];
      const changed = [];
      let backendSum = 0;

      checks.forEach(({ item, product }) => {
        if (!product || product.status !== 'AVAILABLE') {
          unavail.push(item.productName);
          return;
        }
        const oldPrice = Number(item.unitPrice || 0);
        const newPrice = Number(product.price || 0);
        if (oldPrice !== newPrice) {
          changed.push({
            productId: item.productId,
            productName: product.name,
            oldPrice,
            newPrice,
          });
        }
        backendSum += newPrice * Number(item.quantity || 0);
      });

      setUnavailableItems(unavail);
      setPriceChanges(changed);
      setVerifiedSubtotal(backendSum);
      if (changed.length === 0) {
        setConfirmPriceChange(false);
      }
    } finally {
      setVerifying(false);
    }
  }, [isDirectBuyNow, directItem, fetchCart]);

  useEffect(() => {
    verifyItemsWithBackend();
  }, [verifyItemsWithBackend]);

  const rawSubtotal =
    verifiedSubtotal !== null
      ? verifiedSubtotal
      : isDirectBuyNow
        ? Number(directItem.unitPrice || 0) * Number(directItem.quantity || 1)
        : Number(cartTotalAmount || 0);

  const discountAmount = Number(activeVoucher?.discountAmount || 0);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  const itemsSignature = useMemo(
    () => checkoutItems.map((i) => `${i.productId}:${i.quantity}`).join(','),
    [checkoutItems]
  );

  const buildRequestFingerprint = (payload) =>
    [
      payload.receiverName,
      payload.receiverPhone,
      payload.shippingAddress,
      payload.note || '',
      payload.paymentMethod,
      String(Boolean(payload.confirmPriceChange)),
      payload.voucherCode || '',
      isDirectBuyNow ? `DIRECT:${itemsSignature}` : `CART:${itemsSignature}`,
    ].join('|');

  const getOrRefreshIdempotencyKey = (payload) => {
    const fp = buildRequestFingerprint(payload);
    if (!idempotencyRef.current.key || idempotencyRef.current.fingerprint !== fp) {
      idempotencyRef.current = {
        key: generateIdempotencyKey(),
        fingerprint: fp,
      };
    }
    return idempotencyRef.current.key;
  };

  const handleApplyVoucherCheckout = async () => {
    const trimmed = voucherInput.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập mã giảm giá.');
      return;
    }
    setApplyingVoucher(true);
    try {
      const res = await orderService.validateVoucher(trimmed, rawSubtotal);
      if (res?.data) {
        setActiveVoucher(res.data);
        setVoucherInput(res.data.code);
        toast.success(`Đã áp dụng mã ${res.data.code}: ${res.data.description}!`);
      }
    } catch (err) {
      toast.error(err?.message || 'Mã giảm giá không hợp lệ.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const next = {};
    if (!form.receiverName.trim() || form.receiverName.trim().length < 2) {
      next.receiverName = 'Vui lòng nhập họ tên người nhận (từ 2 ký tự)';
    }
    if (!form.receiverPhone.trim()) {
      next.receiverPhone = 'Vui lòng nhập số điện thoại người nhận';
    } else if (!isValidVietnamPhone(form.receiverPhone)) {
      next.receiverPhone = 'Số điện thoại không đúng định dạng Việt Nam';
    }
    if (!form.shippingAddress.trim() || form.shippingAddress.trim().length < 5) {
      next.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng chi tiết (từ 5 ký tự)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    if (checkoutItems.length === 0) {
      toast.error('Chưa có món ăn nào để đặt hàng.');
      navigate('/products');
      return;
    }

    if (unavailableItems.length > 0) {
      setApiError(
        `Món ăn hiện đã hết hàng hoặc ngừng bán (${unavailableItems.join(', ')}).`
      );
      return;
    }

    if (priceChanges.length > 0 && !confirmPriceChange) {
      setApiError('Giá món ăn có thay đổi. Vui lòng tích xác nhận đồng ý giá mới trước khi đặt hàng.');
      return;
    }

    const payload = {
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      shippingAddress: form.shippingAddress.trim(),
      note: form.note.trim() || null,
      paymentMethod: 'COD',
      confirmPriceChange: priceChanges.length > 0 ? confirmPriceChange : false,
      voucherCode: activeVoucher?.code || null,
      items: isDirectBuyNow
        ? [
            {
              productId: directItem.productId,
              quantity: directItem.quantity,
              expectedUnitPrice: directItem.unitPrice,
            },
          ]
        : null,
    };

    const idempotencyKey = getOrRefreshIdempotencyKey(payload);

    setSubmitting(true);
    setApiError('');
    try {
      const res = await orderService.createOrder(payload, idempotencyKey);
      const createdOrder = res?.data;

      if (!isDirectBuyNow) {
        clearVoucher();
        await fetchCart();
      }

      orderCompletedRef.current = true;
      toast.success(
        `Đặt hàng thành công! Mã đơn của bạn: ${createdOrder?.orderCode || ''}`
      );
      navigate(
        createdOrder?.id
          ? `/profile?tab=orders&orderId=${createdOrder.id}`
          : '/profile?tab=orders',
        { replace: true }
      );
    } catch (err) {
      if (err?.status === 409 && err?.data?.priceChanges) {
        setPriceChanges(err.data.priceChanges);
        if (err.data.newTotalAmount !== undefined) {
          setVerifiedSubtotal(Number(err.data.newTotalAmount));
        }
        setConfirmPriceChange(false);
      }
      setApiError(err?.message || 'Đặt hàng thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!verifying && checkoutItems.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
        <div className="rounded-3xl bg-white p-10 shadow-card">
          <h1 className="text-xl font-extrabold text-[#262626]">
            Chưa có món ăn nào để thanh toán
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Vui lòng chọn món ăn từ thực đơn trước khi tiến hành đặt đơn.
          </p>
          <Link to="/products" className="fh-btn-primary mt-6">
            Quay lại Thực đơn
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:py-9">
      {/* Thanh tiến trình 3 bước bám sát checkout.png */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs font-bold sm:gap-5 sm:text-sm">
        {isDirectBuyNow ? (
          <Link
            to={`/products/${directItem.productId}`}
            className="flex items-center gap-2 text-[#F47721] hover:underline"
          >
            <CheckCircleIcon className="h-6 w-6 text-[#F47721]" />
            <span>Chọn món đặt ngay</span>
          </Link>
        ) : (
          <Link to="/cart" className="flex items-center gap-2 text-[#F47721] hover:underline">
            <CheckCircleIcon className="h-6 w-6 text-[#F47721]" />
            <span>Giỏ hàng</span>
          </Link>
        )}

        <span className="text-[#F47721]">→</span>

        <div className="flex items-center gap-2 text-[#F47721]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F47721] text-xs font-extrabold text-white">
            2
          </span>
          <span>Thông tin đặt hàng & Thanh toán</span>
        </div>

        <span className="text-gray-300">→</span>

        <div className="flex items-center gap-2 text-gray-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs font-bold">
            3
          </span>
          <span>Hoàn tất</span>
        </div>
      </div>

      {unavailableItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">
            Món ăn hiện không còn khả dụng: {unavailableItems.join(', ')}.
          </p>
          <Link
            to={isDirectBuyNow ? '/products' : '/cart'}
            className="mt-2 inline-block font-bold text-[#F47721] underline"
          >
            ← Quay lại chọn món khác
          </Link>
        </div>
      )}

      {priceChanges.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
          <p className="font-bold text-amber-900">
            Thông báo cập nhật giá món ăn từ cửa hàng:
          </p>
          <ul className="mt-2 space-y-1 text-xs sm:text-sm">
            {priceChanges.map((pc) => (
              <li key={pc.productId}>
                • <strong>{pc.productName}</strong>: {formatCurrencyVnd(pc.oldPrice)} →{' '}
                <strong className="text-[#F47721]">{formatCurrencyVnd(pc.newPrice)}</strong>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex cursor-pointer items-center gap-2 font-semibold text-[#262626]">
            <input
              type="checkbox"
              checked={confirmPriceChange}
              onChange={(e) => {
                setConfirmPriceChange(e.target.checked);
                setApiError('');
              }}
              className="h-4 w-4 rounded border-gray-300 text-[#F47721] focus:ring-[#F47721]"
            />
            <span>
              Tôi đã kiểm tra và đồng ý đặt hàng theo mức giá mới ({formatCurrencyVnd(finalTotal)})
            </span>
          </label>
        </div>
      )}

      {apiError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-medium text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} noValidate className="grid items-start gap-6 lg:grid-cols-12">
        {/* Cột trái: Thông tin nhận hàng + Phương thức thanh toán */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-lg font-extrabold uppercase tracking-tight text-[#262626] sm:text-xl">
              THÔNG TIN NHẬN HÀNG
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <LocationIcon className="h-4 w-4 text-gray-400" />
              Địa chỉ và thông tin người nhận
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Họ tên người nhận
                </label>
                <input
                  name="receiverName"
                  type="text"
                  value={form.receiverName}
                  onChange={handleChange}
                  placeholder="Nhập họ tên người nhận..."
                  className={`fh-input ${errors.receiverName ? 'border-red-400' : ''}`}
                />
                {errors.receiverName && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.receiverName}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Số điện thoại
                </label>
                <input
                  name="receiverPhone"
                  type="tel"
                  value={form.receiverPhone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại nhận hàng..."
                  className={`fh-input ${errors.receiverPhone ? 'border-red-400' : ''}`}
                />
                {errors.receiverPhone && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.receiverPhone}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Địa chỉ nhận hàng
                </label>
                <input
                  name="shippingAddress"
                  type="text"
                  value={form.shippingAddress}
                  onChange={handleChange}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  className={`fh-input ${errors.shippingAddress ? 'border-red-400' : ''}`}
                />
                {errors.shippingAddress && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.shippingAddress}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  rows={3}
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Ví dụ: Giao giờ trưa, đồ ăn ít cay..."
                  className="fh-input resize-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#262626]">
              PHƯƠNG THỨC THANH TOÁN
            </h2>

            <div className="mt-4 rounded-2xl border-2 border-[#F47721] bg-[#FFF8F0] p-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#F47721]" />
                <div>
                  <p className="text-sm font-bold text-[#262626]">
                    Thanh toán khi nhận hàng (COD)
                  </p>  
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Đơn hàng của bạn + Khuyến mãi + Nút xác nhận COD */}
        <aside className="sticky top-24 rounded-2xl bg-white p-6 shadow-card sm:p-7 lg:col-span-5">
          <div className="flex items-baseline justify-between border-b border-gray-100 pb-3.5">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#262626]">
              ĐƠN HÀNG CỦA BẠN
            </h2>
            <span className="text-xs font-medium text-gray-500">
              ({checkoutItems.length} món)
            </span>
          </div>

          <div className="mt-4 max-h-64 space-y-3.5 overflow-y-auto pr-1">
            {checkoutItems.map((item) => {
              const changedItem = priceChanges.find((pc) => pc.productId === item.productId);
              const unit = changedItem ? changedItem.newPrice : item.unitPrice;
              const lineTotal = Number(unit) * Number(item.quantity);

              return (
                <div key={item.productId} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#F4E5D7] bg-[#FFF8F0]">
                      <FoodImage
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#262626]">{item.productName}</p>
                      <p className="text-xs text-gray-500">x {item.quantity}</p>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-bold text-[#262626]">
                    {formatCurrencyVnd(lineTotal)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Ô nhập / đổi mã khuyến mãi ngay tại Checkout */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá "
                className="fh-input flex-1 py-2 text-xs uppercase placeholder:normal-case"
              />
              <button
                type="button"
                disabled={applyingVoucher}
                onClick={handleApplyVoucherCheckout}
                className="shrink-0 rounded-xl border border-[#F47721] bg-white px-3.5 py-2 text-xs font-bold text-[#F47721] transition hover:bg-[#FFF8F0]"
              >
                {applyingVoucher ? '...' : 'Áp dụng'}
              </button>
            </div>
            {activeVoucher && (
              <div className="mt-2 flex items-center justify-between text-xs text-emerald-700">
                <span>
                  Mã <strong>{activeVoucher.code}</strong>: {activeVoucher.description}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveVoucher(null);
                    setVoucherInput('');
                    if (!isDirectBuyNow) clearVoucher();
                  }}
                  className="font-bold text-red-500 hover:underline"
                >
                  Bỏ mã
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span>
              <span className="font-bold text-[#262626]">{formatCurrencyVnd(rawSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí giao hàng:</span>
              <span className="font-bold text-emerald-600">0 đ</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Khuyến mãi:</span>
              <span className="font-bold text-emerald-600">
                {discountAmount > 0 ? `-${formatCurrencyVnd(discountAmount)}` : '0 đ'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4">
            <span className="text-base font-extrabold text-[#262626]">Tổng thanh toán:</span>
            <span className="text-2xl font-extrabold text-[#F47721]">
              {verifying ? 'Đang đối chiếu...' : formatCurrencyVnd(finalTotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || verifying || unavailableItems.length > 0}
            className="fh-btn-primary mt-6 w-full py-3.5 uppercase tracking-wide"
          >
            {submitting
              ? 'ĐANG XÁC NHẬN ĐƠN HÀNG...'
              : verifying
                ? 'ĐANG ĐỐI CHIẾU GIÁ...'
                : 'XÁC NHẬN ĐẶT HÀNG (COD)'}
          </button>
        </aside>
      </form>

      {/* Modal xác nhận khi người dùng muốn thoát khỏi màn hình đặt hàng */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-[#F47721]">
              !
            </div>
            <h3 className="mt-4 text-center text-lg font-extrabold text-[#262626]">
              Xác nhận rời khỏi màn hình đặt hàng?
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">
              Đơn hàng của bạn chưa được xác nhận đặt. Nếu thoát ngay bây giờ, thông tin bạn vừa
              nhập trên trang này sẽ không được lưu.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  toast.info('Bạn đã thoát khỏi màn hình đặt hàng. Đơn hàng chưa được tạo.');
                  blocker.proceed();
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                Xác nhận thoát
              </button>
              <button
                type="button"
                onClick={() => blocker.reset()}
                className="fh-btn-primary py-2.5"
              >
                Ở lại tiếp tục đặt hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
