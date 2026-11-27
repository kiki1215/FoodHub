import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon } from '../../components/common/Icons';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import axiosClient from '../../services/axiosClient';
import { formatCurrencyVnd } from '../../utils/formatters';

const STATUS_META = {
  PENDING: {
    label: 'Chờ xác nhận',
    cls: 'border-[#F47721]/60 bg-[#FFF8F0] text-[#F47721]',
    next: ['CONFIRMED', 'CANCELLED'],
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    cls: 'border-sky-300 bg-sky-50 text-sky-700',
    next: ['PREPARING', 'CANCELLED'],
  },
  PREPARING: {
    label: 'Đang chuẩn bị',
    cls: 'border-indigo-300 bg-indigo-50 text-indigo-700',
    next: ['SHIPPING', 'CANCELLED'],
  },
  SHIPPING: {
    label: 'Đang giao',
    cls: 'border-blue-300 bg-blue-50 text-blue-700',
    next: ['COMPLETED'],
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    next: [],
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls: 'border-red-300 bg-red-50 text-red-700',
    next: [],
  },
};

const PAGE_SIZE = 8;

export default function AdminOrdersPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const [orderPage, setOrderPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);

  // Đơn hàng đang chọn bên khung Chi tiết phải (bám sát admin-orders.png)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const selectOrderById = useCallback(
    async (id) => {
      if (!id) return;
      setLoadingDetail(true);
      try {
        const res = await adminService.getOrderDetail(id);
        if (res?.data) {
          setSelectedOrder(res.data);
          setNextStatus(res.data.status);
        }
      } catch (err) {
        toast.error(err?.message || 'Không thể tải chi tiết đơn hàng.');
      } finally {
        setLoadingDetail(false);
      }
    },
    [toast]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const isCancelRequestFilter = statusFilter === 'CANCEL_REQUESTED';
      const res = await adminService.getOrders({
        orderCode: orderCode || undefined,
        status: !isCancelRequestFilter && statusFilter ? statusFilter : undefined,
        cancelRequested: isCancelRequestFilter ? true : undefined,
        page,
        size: PAGE_SIZE,
      });
      const data = res?.data || { content: [], page: 0, totalPages: 0, totalElements: 0 };
      setOrderPage(data);

      const urlSelected = searchParams.get('selected');
      if (urlSelected) {
        selectOrderById(Number(urlSelected));
      } else if (data.content?.length > 0 && !selectedOrder) {
        setSelectedOrder(data.content[0]);
        setNextStatus(data.content[0].status);
      } else if (data.content?.length === 0) {
        setSelectedOrder(null);
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [orderCode, statusFilter, page, searchParams, selectOrderById]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setOrderCode(searchInput.trim());
    setPage(0);
  };

  const handleRowClick = (ord) => {
    setSelectedOrder(ord);
    setNextStatus(ord.status);
    if (searchParams.get('selected')) {
      setSearchParams({});
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder || !nextStatus || nextStatus === selectedOrder.status) {
      toast.info('Trạng thái đơn hàng chưa thay đổi.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await adminService.updateOrderStatus(selectedOrder.id, nextStatus);
      if (res?.data) {
        setSelectedOrder(res.data);
        setNextStatus(res.data.status);
        setOrderPage((prev) => ({
          ...prev,
          content: prev.content.map((o) => (o.id === res.data.id ? res.data : o)),
        }));
      }
      toast.success('Đã cập nhật trạng thái đơn hàng thành công!');
    } catch (err) {
      toast.error(err?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAdminCancelDecision = async (approve) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res =
        typeof adminService.handleCancelRequest === 'function'
          ? await adminService.handleCancelRequest(selectedOrder.id, approve)
          : await axiosClient.post(`/admin/orders/${selectedOrder.id}/cancel-request`, { approve });
      if (res?.data) {
        setSelectedOrder(res.data);
        setNextStatus(res.data.status);
        setOrderPage((prev) => ({
          ...prev,
          content: prev.content.map((o) => (o.id === res.data.id ? res.data : o)),
        }));
      }
      toast.success(
        approve
          ? `Đã xác nhận hủy đơn #${selectedOrder.orderCode}.`
          : `Đã từ chối yêu cầu hủy đơn #${selectedOrder.orderCode}.`
      );
      if (statusFilter === 'CANCEL_REQUESTED') {
        fetchOrders();
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể xử lý yêu cầu hủy đơn.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentMeta = selectedOrder
    ? STATUS_META[selectedOrder.status] || STATUS_META.PENDING
    : null;
  const allowedStatuses = selectedOrder
    ? [selectedOrder.status, ...(currentMeta?.next || [])]
    : [];

  const startIdx = orderPage.totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIdx = Math.min((page + 1) * PAGE_SIZE, orderPage.totalElements);

  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#1E2532]">
        QUẢN LÝ ĐƠN HÀNG
      </h1>

      {/* Thanh tìm kiếm mã đơn + lọc trạng thái bám sát admin-orders.png */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm mã đơn hàng..."
            className="fh-input pl-10"
          />
          <button
            type="submit"
            aria-label="Tìm đơn"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F47721]"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="fh-input w-full sm:w-56"
        >
          <option value="">Trạng thái: Tất cả</option>
          <option value="CANCEL_REQUESTED">⚠ Yêu cầu hủy chờ duyệt</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            setOrderCode('');
            setStatusFilter('');
            setPage(0);
            setSelectedOrder(null);
            if (searchParams.get('selected')) {
              setSearchParams({});
            }
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#262626] shadow-xs transition hover:border-[#F47721] hover:text-[#F47721]"
        >
          ↻ Làm mới
        </button>
      </div>

      {/* Bố cục 2 cột: Bảng danh sách đơn (trái) + Chi tiết đơn hàng (phải) bám sát admin-orders.png */}
      <div className="mt-5 grid items-start gap-6 xl:grid-cols-12">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs xl:col-span-7">
          {loading ? (
            <div className="py-14 text-center text-sm text-gray-500">
              Đang tải danh sách đơn hàng...
            </div>
          ) : orderPage.content.length === 0 ? (
            <div className="py-14 text-center text-sm text-gray-500">
              Không tìm thấy đơn hàng nào phù hợp.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/90 text-xs font-bold text-gray-700">
                      <th className="px-4 py-3.5">Mã đơn</th>
                      <th className="px-4 py-3.5">Khách hàng</th>
                      <th className="px-4 py-3.5">Ngày đặt</th>
                      <th className="px-4 py-3.5">Tổng tiền</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orderPage.content.map((ord) => {
                      const st = STATUS_META[ord.status] || STATUS_META.PENDING;
                      const isSelected = selectedOrder?.id === ord.id;
                      return (
                        <tr
                          key={ord.id}
                          onClick={() => handleRowClick(ord)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-[#FFF8F0]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-[#1E2532]">
                            #{ord.orderCode}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-[#262626]">
                            {ord.receiverName}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            {ord.createdAt
                              ? new Date(ord.createdAt).toLocaleDateString('vi-VN')
                              : '—'}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-[#262626]">
                            {formatCurrencyVnd(ord.totalAmount)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${st.cls}`}
                              >
                                {st.label}
                              </span>
                              {ord.cancelRequested && ord.status === 'PENDING' && (
                                <span className="inline-block rounded-lg border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-extrabold text-red-600">
                                  ⚠ Yêu cầu hủy
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer phân trang đồng bộ ảnh mẫu */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3.5 text-xs text-gray-500">
                <span>
                  Hiển thị {startIdx}-{endIdx} trên {orderPage.totalElements} đơn hàng
                </span>

                {orderPage.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 0}
                      onClick={() => setPage((p) => p - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 hover:border-[#F47721] disabled:opacity-40"
                    >
                      ‹
                    </button>
                    {Array.from({ length: orderPage.totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPage(idx)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold transition ${
                          idx === page
                            ? 'bg-[#F47721] text-white'
                            : 'border border-gray-200 bg-white text-gray-700 hover:border-[#F47721]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={page >= orderPage.totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 hover:border-[#F47721] disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Khung Chi tiết đơn hàng bên phải bám sát admin-orders.png */}
        <aside className="rounded-2xl bg-white p-6 shadow-xs xl:col-span-5">
          {loadingDetail ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Đang tải chi tiết đơn hàng...
            </div>
          ) : !selectedOrder ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Chọn một đơn hàng ở bảng bên trái để xem chi tiết và cập nhật trạng thái.
            </div>
          ) : (
            <div>
              <h2 className="border-b border-gray-100 pb-3.5 text-base font-extrabold uppercase text-[#1E2532]">
                CHI TIẾT ĐƠN HÀNG #{selectedOrder.orderCode}
              </h2>

              <div className="mt-4 space-y-1.5 border-b border-gray-100 pb-4 text-sm text-[#262626]">
                <p>
                  <span className="text-gray-500">Khách hàng:</span>{' '}
                  <strong>{selectedOrder.receiverName}</strong> (User ID: #{selectedOrder.userId})
                </p>
                <p>
                  <span className="text-gray-500">SĐT:</span>{' '}
                  <strong>{selectedOrder.receiverPhone}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Địa chỉ:</span> {selectedOrder.shippingAddress}
                </p>
                <p>
                  <span className="text-gray-500">Thời gian đặt:</span>{' '}
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN')
                    : '—'}
                </p>
              </div>

              {/* Danh sách món ăn */}
              <div className="mt-4 border-b border-gray-100 pb-4">
                <h3 className="text-sm font-bold text-[#1E2532]">Danh sách món ăn</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                  {selectedOrder.items?.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>
                        {item.productName} ({item.quantity}x)
                      </span>
                      <span className="font-semibold text-[#262626]">
                        {formatCurrencyVnd(item.subtotal)}
                      </span>
                    </li>
                  ))}
                  {Number(selectedOrder.discountAmount || 0) > 0 && (
                    <li className="flex justify-between text-emerald-700">
                      <span>
                        Mã giảm giá {selectedOrder.voucherCode ? `(${selectedOrder.voucherCode})` : ''}
                      </span>
                      <span className="font-bold">
                        -{formatCurrencyVnd(selectedOrder.discountAmount)}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm font-extrabold text-[#1E2532]">Tổng cộng:</span>
                <span className="text-lg font-extrabold text-[#F47721]">
                  {formatCurrencyVnd(selectedOrder.totalAmount)}
                </span>
              </div>

              <div className="mt-3 text-sm">
                <span className="font-bold text-[#1E2532]">Ghi chú:</span>
                <p className="mt-0.5 text-gray-600">
                  {selectedOrder.note || 'Không có ghi chú thêm'}
                </p>
              </div>

              {/* Hộp xử lý Yêu cầu hủy đơn từ khách hàng (chờ Admin xác nhận) */}
              {selectedOrder.cancelRequested && selectedOrder.status === 'PENDING' && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50/90 p-4">
                  <p className="text-xs font-extrabold uppercase text-red-700">
                    ⚠ Khách hàng đang yêu cầu hủy đơn
                  </p>
                  <p className="mt-1 text-xs text-red-900">
                    <strong>Lý do:</strong>{' '}
                    {selectedOrder.cancelReason || 'Khách hàng không nhập lý do cụ thể'}
                  </p>
                  {selectedOrder.cancelRequestedAt && (
                    <p className="mt-0.5 text-[11px] text-red-700/80">
                      Gửi lúc: {new Date(selectedOrder.cancelRequestedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleAdminCancelDecision(false)}
                      className="rounded-xl border border-gray-300 bg-white py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                      Từ chối hủy
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleAdminCancelDecision(true)}
                      className="rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {updatingStatus ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cập nhật trạng thái hợp lệ */}
              <div className="mt-5 border-t border-gray-100 pt-4">
                <label className="mb-1.5 block text-sm font-bold text-[#1E2532]">
                  Cập nhật trạng thái
                </label>

                {currentMeta?.next?.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-600">
                    Đơn hàng đã ở trạng thái kết thúc (<strong>{currentMeta.label}</strong>), không
                    thể chuyển tiếp.
                  </div>
                ) : (
                  <>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="fh-input"
                    >
                      {allowedStatuses.map((stKey) => (
                        <option key={stKey} value={stKey}>
                          {STATUS_META[stKey]?.label || stKey}
                        </option>
                      ))}
                    </select>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => setNextStatus(selectedOrder.status)}
                        className="rounded-xl bg-gray-200 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={updatingStatus || nextStatus === selectedOrder.status}
                        onClick={handleSaveStatus}
                        className="rounded-xl bg-[#F47721] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {updatingStatus ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
