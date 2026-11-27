import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FoodImage from '../../components/common/FoodImage';
import { menuService } from '../../services/menuService';
import { adminService } from '../../services/adminService';
import { formatCurrencyVnd } from '../../utils/formatters';

const ORDER_STATUS_META = {
  PENDING: { label: 'Chờ xác nhận', badge: 'border-amber-300 bg-amber-50 text-amber-800', bar: 'bg-amber-400' },
  CONFIRMED: { label: 'Đã xác nhận', badge: 'border-sky-300 bg-sky-50 text-sky-800', bar: 'bg-sky-500' },
  PREPARING: { label: 'Đang chuẩn bị', badge: 'border-indigo-300 bg-indigo-50 text-indigo-800', bar: 'bg-indigo-500' },
  SHIPPING: { label: 'Đang giao', badge: 'border-blue-300 bg-blue-50 text-blue-700', bar: 'bg-blue-500' },
  COMPLETED: { label: 'Hoàn thành', badge: 'border-emerald-300 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
  CANCELLED: { label: 'Đã hủy', badge: 'border-red-300 bg-red-50 text-red-700', bar: 'bg-red-500' },
};

export default function AdminDashboardPage() {
  const [userStats, setUserStats] = useState(null);
  const [menuStats, setMenuStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, mRes, oRes, recentRes, bestRes] = await Promise.all([
        adminService.getUserStats(),
        adminService.getMenuStats(),
        adminService.getOrderStats({ topLimit: 5 }),
        adminService.getOrders({ page: 0, size: 6 }),
        menuService.getBestSellers(4),
      ]);
      setUserStats(uRes?.data || null);
      setMenuStats(mRes?.data || null);
      setOrderStats(oRes?.data || null);
      setRecentOrders(recentRes?.data?.content || []);
      setBestSellers(bestRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu thống kê tổng quan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalOrders = Number(orderStats?.totalOrders || 0);
  const ordersByStatus = orderStats?.ordersByStatus || {};

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#1E2532]">
          TỔNG QUAN HỆ THỐNG
        </h1>
        
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* 4 Thẻ Thống Kê bám sát admin-dashboard.png */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Doanh thu đơn hoàn thành"
          value={loading ? '...' : formatCurrencyVnd(orderStats?.completedRevenue || 0)}
          subText={`${ordersByStatus.COMPLETED ?? 0} đơn hoàn thành`}
          subBadgeCls="bg-emerald-50 text-emerald-700"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />

        <StatCard
          title="Tổng đơn hàng"
          value={loading ? '...' : `${totalOrders} đơn`}
          subText={`${ordersByStatus.PENDING ?? 0} đơn chờ xác nhận`}
          subBadgeCls="bg-amber-50 text-amber-700"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M3 4H5L7.4 15.2H18.8L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />

        <StatCard
          title="Tổng tài khoản"
          value={loading ? '...' : `${userStats?.totalUsers ?? 0} người`}
          subText={`${userStats?.customerCount ?? 0} khách • ${userStats?.adminCount ?? 0} admin`}
          subBadgeCls="bg-sky-50 text-sky-700"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20C4.8 16.4 8 14 12 14C16 14 19.2 16.4 20 20" strokeLinecap="round" />
            </svg>
          }
        />

        <StatCard
          title="Tổng số món ăn"
          value={loading ? '...' : `${menuStats?.totalProducts ?? 0} món`}
          subText={`${menuStats?.availableProducts ?? 0} món đang phục vụ`}
          subBadgeCls="bg-orange-50 text-[#F47721]"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15C4 10.6 7.6 7 12 7C16.4 7 20 10.6 20 15H4Z" />
              <path d="M3 18H21M12 4V7" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Hàng giữa: Thống kê trạng thái đơn hàng + Món ăn bán chạy nhất */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl bg-white p-6 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#1E2532]">
              Thống kê đơn hàng theo trạng thái
            </h2>
            <Link to="/admin/orders" className="text-xs font-bold text-[#F47721] hover:underline">
              Quản lý đơn →
            </Link>
          </div>

          <div className="mt-5 space-y-3.5">
            {Object.entries(ORDER_STATUS_META).map(([key, meta]) => {
              const count = Number(ordersByStatus[key] || 0);
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#262626]">{meta.label}</span>
                    <span className="text-gray-600">
                      <strong>{count}</strong> đơn ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.bar}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Món ăn bán chạy nhất bám sát admin-dashboard.png */}
        <div className="rounded-2xl bg-white p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#1E2532]">Món ăn bán chạy nhất</h2>
            <Link to="/admin/products" className="text-xs font-bold text-[#F47721] hover:underline">
              Xem thực đơn →
            </Link>
          </div>

          {bestSellers.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-500">Chưa có dữ liệu món bán chạy.</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {bestSellers.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-4 text-sm font-extrabold text-[#F47721]">{idx + 1}.</span>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-[#FFF8F0]">
                      <FoodImage src={item.imageUrl} alt={item.name} className="h-full w-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#262626]">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrencyVnd(item.price)}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-extrabold text-[#1E2532]">
                    {item.soldCount ?? 0} lượt đặt
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bảng Đơn hàng gần đây bám sát admin-dashboard.png */}
      <div className="rounded-2xl bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1E2532]">Đơn hàng gần đây</h2>
          <Link to="/admin/orders" className="text-xs font-bold text-[#F47721] hover:underline">
            Xem toàn bộ đơn hàng →
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Đang tải danh sách đơn...</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Hệ thống chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase text-gray-600">
                  <th className="rounded-l-xl px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="rounded-r-xl px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((ord) => {
                  const st = ORDER_STATUS_META[ord.status] || ORDER_STATUS_META.PENDING;
                  return (
                    <tr key={ord.id} className="transition hover:bg-[#FFF8F0]/60">
                      <td className="px-4 py-3.5 font-bold text-[#1E2532]">
                        <Link
                          to={`/admin/orders?selected=${ord.id}`}
                          className="hover:text-[#F47721] hover:underline"
                        >
                          #{ord.orderCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#262626]">{ord.receiverName}</td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#262626]">
                        {formatCurrencyVnd(ord.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${st.badge}`}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subText, subBadgeCls, icon }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-xs">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F47721] text-white shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="mt-1 truncate text-xl font-extrabold text-[#1E2532] sm:text-2xl">{value}</p>
        <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${subBadgeCls}`}>
          {subText}
        </span>
      </div>
    </div>
  );
}
