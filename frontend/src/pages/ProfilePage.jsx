import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FoodImage from '../components/common/FoodImage';
import {
  ClockIcon,
  FileTextIcon,
  LockIcon,
  LogOutIcon,
  UserIcon,
} from '../components/common/Icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import axiosClient from '../services/axiosClient';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { formatCurrencyVnd, isValidEmail, resolveImageUrl } from '../utils/formatters';

const STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-800 border-amber-200', step: 0 },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-sky-100 text-sky-800 border-sky-200', step: 1 },
  PREPARING: { label: 'Đang chuẩn bị', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200', step: 2 },
  SHIPPING: { label: 'Đang giao hàng', cls: 'bg-orange-100 text-[#F47721] border-orange-200', step: 3 },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', step: 4 },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700 border-red-200', step: -1 },
};

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'PREPARING', label: 'Đang chuẩn bị' },
  { key: 'SHIPPING', label: 'Đang giao hàng' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
];

export default function ProfilePage() {
  const { user, logout, updateUserState } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const activeTab = searchParams.get('tab') || 'info';
  const selectedOrderId = searchParams.get('orderId');

  // Form hồ sơ cá nhân
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Dữ liệu đơn hàng thật từ Order Service
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Chi tiết 1 đơn hàng khi bấm "Xem chi tiết" hoặc điều hướng từ Checkout
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Yêu cầu hủy đơn hàng khi đơn còn ở trạng thái PENDING (Chờ xác nhận)
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (activeTab !== 'orders' && activeTab !== 'tracking') return;
    setLoadingOrders(true);
    try {
      const res = await orderService.getMyOrders(
        activeTab === 'orders' && statusFilter ? statusFilter : undefined
      );
      setOrders(res?.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoadingOrders(false);
    }
  }, [activeTab, statusFilter, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Tải chi tiết đơn hàng khi có ?orderId= trên URL
  const loadSingleOrder = useCallback(async () => {
    if (!selectedOrderId) {
      setOrderDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await orderService.getOrderDetail(selectedOrderId);
      setOrderDetail(res?.data || null);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải chi tiết đơn hàng.');
      setOrderDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedOrderId, toast]);

  useEffect(() => {
    loadSingleOrder();
  }, [loadSingleOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateProfile = () => {
    const next = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Họ tên phải từ 2 ký tự trở lên';
    }
    if (!form.email.trim() || !isValidEmail(form.email)) {
      next.email = 'Email không hợp lệ';
    }
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (dob >= new Date()) {
        next.dateOfBirth = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address.trim(),
      };
      const res = await userService.updateMyProfile(payload);
      if (res?.data) {
        updateUserState(res.data);
      }
      toast.success('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      if (err?.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      toast.error(err?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await userService.uploadMyAvatarFile(file);
      if (res?.data) {
        updateUserState(res.data);
      }
      toast.success('Đã cập nhật ảnh đại diện thành công!');
    } catch (err) {
      toast.error(err?.message || 'Tải ảnh đại diện thất bại.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất tài khoản.');
    navigate('/login');
  };

  const switchTab = (tabName) => {
    if (tabName === 'info') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabName });
    }
  };

  const openCancelOrderModal = (order) => {
    setCancelTarget(order);
    setCancelReason('');
  };

  const handleConfirmCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const trimmedReason = cancelReason.trim();
      if (typeof orderService.cancelMyOrder === 'function') {
        await orderService.cancelMyOrder(cancelTarget.id, trimmedReason);
      } else {
        await axiosClient.post(
          `/orders/${cancelTarget.id}/cancel`,
          trimmedReason ? { reason: trimmedReason } : {}
        );
      }
      toast.success(
        `Đã gửi yêu cầu hủy đơn #${cancelTarget.orderCode}. Vui lòng chờ quản trị viên xác nhận.`
      );
      setCancelTarget(null);
      setCancelReason('');
      await loadOrders();
      if (selectedOrderId && String(selectedOrderId) === String(cancelTarget.id)) {
        await loadSingleOrder();
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể hủy đơn hàng này.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Menu trái bám sát profile.png */}
        <aside className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-card lg:min-h-[480px] lg:w-64">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => switchTab('info')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === 'info'
                  ? 'bg-[#F47721] text-white shadow-sm'
                  : 'text-[#262626] hover:bg-[#FFF8F0] hover:text-[#F47721]'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              <span>Thông tin cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('orders')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-[#F47721] text-white shadow-sm'
                  : 'text-[#262626] hover:bg-[#FFF8F0] hover:text-[#F47721]'
              }`}
            >
              <FileTextIcon className="h-5 w-5" />
              <span>Lịch sử đặt hàng</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('tracking')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === 'tracking'
                  ? 'bg-[#F47721] text-white shadow-sm'
                  : 'text-[#262626] hover:bg-[#FFF8F0] hover:text-[#F47721]'
              }`}
            >
              <ClockIcon className="h-5 w-5" />
              <span>Theo dõi đơn hàng</span>
            </button>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#262626] transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOutIcon className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Nội dung chính */}
        <div className="flex-1 rounded-2xl bg-white p-6 shadow-card sm:p-8">
          {activeTab === 'info' && (
            <>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#262626] sm:text-2xl">
                QUẢN LÝ THÔNG TIN CÁ NHÂN
              </h1>

              <div className="mt-7 flex flex-col gap-8 md:flex-row md:items-start">
                {/* Khung ảnh đại diện bên trái */}
                <div className="flex flex-col items-center md:w-52">
                  <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-[#FFF8F0] bg-gray-200 shadow-inner">
                    {user?.avatarUrl ? (
                      <img
                        src={resolveImageUrl(user.avatarUrl)}
                        alt={user.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-full w-full text-gray-400"
                        viewBox="0 0 120 120"
                        fill="currentColor"
                      >
                        <circle cx="60" cy="44" r="22" />
                        <path d="M20 112C24 86 40 74 60 74C80 74 96 86 100 112" />
                      </svg>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileAvatarChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="fh-btn-outline mt-5 w-full"
                  >
                    {uploadingAvatar ? 'Đang tải ảnh...' : 'Thay đổi ảnh đại diện'}
                  </button>
                </div>

                {/* Form thông tin cá nhân 2 cột */}
                <form onSubmit={handleUpdateProfile} noValidate className="flex-1">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                        Họ tên
                      </label>
                      <input
                        name="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={handleChange}
                        className={`fh-input ${errors.fullName ? 'border-red-400' : ''}`}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`fh-input ${errors.email ? 'border-red-400' : ''}`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                        Giới tính
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="fh-input"
                      >
                        <option value="">-- Chọn giới tính --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                        Ngày sinh
                      </label>
                      <input
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth || ''}
                        onChange={handleChange}
                        className={`fh-input ${errors.dateOfBirth ? 'border-red-400' : ''}`}
                      />
                      {errors.dateOfBirth && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={form.phone || 'Chưa cập nhật'}
                          readOnly
                          disabled
                          title="Số điện thoại không được phép tự thay đổi"
                          className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 pr-10 text-sm font-medium text-gray-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                          <LockIcon className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                        Địa chỉ
                      </label>
                      <input
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ nhận hàng mặc định..."
                        className="fh-input"
                      />
                    </div>
                  </div>

                  <div className="mt-7 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="fh-btn-primary min-w-[210px]"
                    >
                      {saving ? 'Đang lưu...' : 'Cập nhật thông tin'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* TAB LỊCH SỬ ĐẶT HÀNG & CHI TIẾT ĐƠN */}
          {activeTab === 'orders' && (
            <div>
              {selectedOrderId ? (
                <OrderDetailView
                  order={orderDetail}
                  loading={loadingDetail}
                  onBack={() => setSearchParams({ tab: 'orders' })}
                  onRefresh={loadSingleOrder}
                  onRequestCancel={openCancelOrderModal}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-extrabold uppercase text-[#262626]">
                      LỊCH SỬ ĐẶT HÀNG
                    </h1>
                    <button
                      type="button"
                      onClick={loadOrders}
                      className="fh-btn-outline px-3 py-1.5 text-xs"
                    >
                      Làm mới
                    </button>
                  </div>

                  {/* Bộ lọc 6 trạng thái */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { key: '', label: 'Tất cả' },
                      { key: 'PENDING', label: 'Chờ xác nhận' },
                      { key: 'CONFIRMED', label: 'Đã xác nhận' },
                      { key: 'PREPARING', label: 'Đang chuẩn bị' },
                      { key: 'SHIPPING', label: 'Đang giao' },
                      { key: 'COMPLETED', label: 'Hoàn thành' },
                      { key: 'CANCELLED', label: 'Đã hủy' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setStatusFilter(st.key)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                          statusFilter === st.key
                            ? 'bg-[#F47721] text-white'
                            : 'border border-[#F4E5D7] bg-[#FFF8F0] text-[#262626] hover:border-[#F47721]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {loadingOrders ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      Đang tải lịch sử đơn hàng...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-[#F4E5D7] bg-[#FFF8F0] p-10 text-center">
                      <p className="text-sm font-medium text-gray-600">
                        Không có đơn hàng nào trong mục này.
                      </p>
                      <Link to="/products" className="fh-btn-primary mt-4 text-xs">
                        Đặt món ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {orders.map((order) => {
                        const meta = STATUS_META[order.status] || STATUS_META.PENDING;
                        return (
                          <div
                            key={order.id}
                            className="rounded-2xl border border-[#F4E5D7] p-4 transition hover:border-[#F47721]/60"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                              <div>
                                <span className="text-sm font-extrabold text-[#262626]">
                                  Mã đơn: {order.orderCode}
                                </span>
                                <span className="ml-3 text-xs text-gray-500">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleString('vi-VN')
                                    : ''}
                                </span>
                              </div>
                              <span
                                className={`rounded-full border px-3 py-0.5 text-xs font-bold ${meta.cls}`}
                              >
                                {meta.label}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs text-gray-600">
                                <p>
                                  Số món: <strong>{order.items?.length || 0}</strong> • Thanh toán:{' '}
                                  <strong>{order.paymentMethod}</strong>
                                </p>
                                <p className="mt-0.5 truncate max-w-md">
                                  Giao tới: {order.shippingAddress}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-base font-extrabold text-[#F47721]">
                                  {formatCurrencyVnd(order.totalAmount)}
                                </span>
                                {order.status === 'PENDING' && order.cancelRequested && (
                                  <span className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                                    ⏳ Chờ Admin xác nhận hủy
                                  </span>
                                )}
                                {order.status === 'PENDING' && !order.cancelRequested && (
                                  <button
                                    type="button"
                                    onClick={() => openCancelOrderModal(order)}
                                    className="rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
                                  >
                                    Yêu cầu hủy
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSearchParams({ tab: 'orders', orderId: String(order.id) })
                                  }
                                  className="fh-btn-outline px-3.5 py-1.5 text-xs"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB THEO DÕI TRẠNG THÁI ĐƠN HÀNG (6 TRẠNG THÁI) */}
          {activeTab === 'tracking' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-extrabold uppercase text-[#262626]">
                    THEO DÕI TRẠNG THÁI ĐƠN HÀNG
                  </h1>
                  <p className="mt-1 text-xs text-gray-500">
                    Theo dõi tiến trình xử lý 6 trạng thái từ lúc đặt đơn tới khi hoàn tất giao hàng.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadOrders}
                  className="fh-btn-outline px-3.5 py-1.5 text-xs"
                >
                  Cập nhật trạng thái
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Đang tải trạng thái đơn hàng...
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#F4E5D7] bg-[#FFF8F0] p-10 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    Bạn chưa có đơn hàng nào để theo dõi.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#F4E5D7] bg-[#FFF8F0]/40 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-extrabold text-[#262626]">
                            Đơn hàng #{order.orderCode}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({order.createdAt
                              ? new Date(order.createdAt).toLocaleString('vi-VN')
                              : ''}
                            )
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {order.status === 'PENDING' && order.cancelRequested && (
                            <span className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                              ⏳ Đang chờ Admin xác nhận hủy
                            </span>
                          )}
                          {order.status === 'PENDING' && !order.cancelRequested && (
                            <button
                              type="button"
                              onClick={() => openCancelOrderModal(order)}
                              className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-xs transition hover:bg-red-600 hover:text-white"
                            >
                              Yêu cầu hủy đơn
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams({ tab: 'orders', orderId: String(order.id) })
                            }
                            className="text-xs font-bold text-[#F47721] hover:underline"
                          >
                            Chi tiết đơn →
                          </button>
                        </div>
                      </div>

                      <OrderStatusTimeline status={order.status} />

                      {order.cancelRequested && order.status === 'PENDING' && (
                        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                          <p className="font-bold">
                            ⏳ Đã gửi yêu cầu hủy đơn — Đang chờ Quản trị viên xác nhận
                          </p>
                          {order.cancelReason && (
                            <p className="mt-0.5 text-amber-800">
                              Lý do gửi kèm: {order.cancelReason}
                            </p>
                          )}
                        </div>
                      )}

                      {!order.cancelRequested && order.cancelRejected && order.status !== 'CANCELLED' && (
                        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-700">
                          Yêu cầu hủy đơn trước đó đã bị từ chối, đơn hàng đang tiếp tục được xử lý.
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                        <div>
                          <span>
                            Người nhận: {order.receiverName} ({order.receiverPhone})
                          </span>
                          {order.status === 'PENDING' && !order.cancelRequested && (
                            <span className="ml-2 inline-block rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              Chưa xác nhận • Có thể yêu cầu hủy
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-[#F47721]">
                          Tổng thanh toán: {formatCurrencyVnd(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hộp thoại Xác nhận yêu cầu hủy đơn hàng (chỉ khi đơn còn PENDING) */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <form
            onSubmit={handleConfirmCancelOrder}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-extrabold text-[#262626]">
              Gửi yêu cầu hủy đơn hàng #{cancelTarget.orderCode}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
              Đơn hàng này đang ở trạng thái <strong>Chờ xác nhận</strong>. Yêu cầu hủy của bạn sẽ
              được gửi tới <strong>Quản trị viên</strong> để xem xét và xác nhận hủy đơn.
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold text-[#262626]">
                Lý do hủy đơn (không bắt buộc)
              </label>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {[
                  'Đặt nhầm món / số lượng',
                  'Muốn đổi địa chỉ nhận hàng',
                  'Muốn áp mã giảm giá khác',
                  'Thay đổi kế hoạch bữa ăn',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReason(preset)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      cancelReason === preset
                        ? 'border-[#F47721] bg-[#FFF8F0] text-[#F47721]'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#F47721]/60'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                maxLength={300}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn (nếu có)..."
                className="fh-input resize-none text-xs"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
                className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                Giữ lại đơn
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu hủy'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function OrderStatusTimeline({ status }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING;

  if (status === 'CANCELLED') {
    return (
      <div className="my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
        ✕  Đơn hàng này đã bị hủy.
      </div>
    );
  }

  return (
    <div className="my-5">
      <div className="grid grid-cols-5 gap-2">
        {ORDER_STEPS.map((st, idx) => {
          const reached = idx <= meta.step;
          const current = idx === meta.step;
          return (
            <div key={st.key} className="flex flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition ${
                  reached
                    ? 'bg-[#F47721] text-white shadow-sm'
                    : 'border border-gray-300 bg-white text-gray-400'
                } ${current ? 'ring-4 ring-[#F47721]/20' : ''}`}
              >
                {idx < meta.step ? '✓' : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-bold leading-tight ${
                  reached ? 'text-[#262626]' : 'text-gray-400'
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetailView({ order, loading, onBack, onRefresh, onRequestCancel }) {
  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Đang tải chi tiết đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-gray-600">Không tìm thấy thông tin đơn hàng.</p>
        <button type="button" onClick={onBack} className="fh-btn-outline mt-4 text-xs">
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const meta = STATUS_META[order.status] || STATUS_META.PENDING;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-[#F47721] hover:underline"
        >
          ← Quay lại lịch sử đơn hàng
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="fh-btn-outline px-3 py-1.5 text-xs"
        >
          Làm mới trạng thái
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#262626]">
            CHI TIẾT ĐƠN HÀNG #{order.orderCode}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Đặt lúc: {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {order.status === 'PENDING' && order.cancelRequested && (
            <span className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800">
              ⏳ Chờ Admin xác nhận hủy
            </span>
          )}
          {order.status === 'PENDING' && !order.cancelRequested && onRequestCancel && (
            <button
              type="button"
              onClick={() => onRequestCancel(order)}
              className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
            >
              Yêu cầu hủy đơn
            </button>
          )}
          <span className={`rounded-full border px-3.5 py-1 text-xs font-bold ${meta.cls}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Thanh theo dõi 6 trạng thái */}
      <OrderStatusTimeline status={order.status} />

      {order.cancelRequested && order.status === 'PENDING' && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-bold">
            ⏳ Bạn đã gửi yêu cầu hủy đơn hàng này — Vui lòng chờ Quản trị viên xác nhận.
          </p>
          {order.cancelReason && (
            <p className="mt-1 text-amber-800">Lý do hủy đã gửi: {order.cancelReason}</p>
          )}
        </div>
      )}

      {/* Thông tin người nhận */}
      <div className="mt-4 rounded-2xl bg-[#FFF8F0] p-4 text-sm">
        <h3 className="font-bold text-[#262626]">Thông tin nhận hàng</h3>
        <div className="mt-2 grid gap-1.5 text-xs text-gray-700 sm:grid-cols-2 sm:text-sm">
          <p>
            <strong>Người nhận:</strong> {order.receiverName}
          </p>
          <p>
            <strong>Số điện thoại:</strong> {order.receiverPhone}
          </p>
          <p className="sm:col-span-2">
            <strong>Địa chỉ giao:</strong> {order.shippingAddress}
          </p>
          {order.note && (
            <p className="sm:col-span-2">
              <strong>Ghi chú:</strong> {order.note}
            </p>
          )}
          <p>
            <strong>Thanh toán:</strong> {order.paymentMethod} (Thanh toán khi nhận hàng)
          </p>
        </div>
      </div>

      {/* Danh sách món ăn đã snapshot */}
      <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-[#F4E5D7] px-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#FFF8F0]">
                <FoodImage
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#262626]">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrencyVnd(item.unitPrice)} × {item.quantity}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-extrabold text-[#262626]">
              {formatCurrencyVnd(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
        {Number(order.discountAmount || 0) > 0 && (
          <>
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span>
              <span className="font-semibold text-[#262626]">
                {formatCurrencyVnd(order.subtotalAmount || order.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Khuyến mãi {order.voucherCode ? `(${order.voucherCode})` : ''}:</span>
              <span className="font-bold">-{formatCurrencyVnd(order.discountAmount)}</span>
            </div>
          </>
        )}
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-base font-bold text-[#262626]">Tổng thanh toán đơn hàng:</span>
          <span className="text-2xl font-extrabold text-[#F47721]">
            {formatCurrencyVnd(order.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
