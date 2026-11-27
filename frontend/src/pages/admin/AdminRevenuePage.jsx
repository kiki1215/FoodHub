import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { formatCurrencyVnd } from '../../utils/formatters';

export default function AdminRevenuePage() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrderStats({
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        topLimit: 10,
      });
      setStats(res?.data || null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const totalOrders = Number(stats?.totalOrders || 0);
  const completedCount = Number(stats?.ordersByStatus?.COMPLETED || 0);
  const completedRevenue = Number(stats?.completedRevenue || 0);
  const avgOrder = completedCount > 0 ? Math.round(completedRevenue / completedCount) : 0;
  const successRate = totalOrders > 0 ? ((completedCount / totalOrders) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#1E2532]">
          THỐNG KÊ DOANH SỐ
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="fh-input w-40 bg-white"
          >
            <option value="">Tất cả các tháng</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="fh-input w-32 bg-white"
          >
            <option value="">Mọi năm</option>
            {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Thẻ chỉ số doanh thu bám sát Doanh số.png */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border-t-4 border-[#F47721] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Tổng doanh thu hoàn thành</p>
          <p className="mt-2 text-2xl font-extrabold text-[#1E2532]">
            {loading ? '...' : formatCurrencyVnd(completedRevenue)}
          </p>
        </div>

        <div className="rounded-2xl border-t-4 border-[#F47721] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Tổng đơn hoàn thành</p>
          <p className="mt-2 text-2xl font-extrabold text-[#1E2532]">
            {loading ? '...' : `${completedCount} đơn`}
          </p>
        </div>

        <div className="rounded-2xl border-t-4 border-[#F47721] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Giá trị TB / đơn hoàn thành</p>
          <p className="mt-2 text-2xl font-extrabold text-[#1E2532]">
            {loading ? '...' : formatCurrencyVnd(avgOrder)}
          </p>
        </div>

        <div className="rounded-2xl border-t-4 border-[#F47721] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Tỷ lệ giao thành công</p>
          <p className="mt-2 text-2xl font-extrabold text-[#1E2532]">
            {loading ? '...' : `${successRate}%`}
          </p>
        </div>
      </div>

      {/* Bảng Top món ăn doanh thu cao nhất theo tháng */}
      <div className="rounded-2xl bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-base font-extrabold text-[#1E2532]">
          Top món ăn bán chạy & doanh thu cao nhất {month ? `(Tháng ${month}/${year})` : ''}
        </h2>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Đang tổng hợp doanh số...</div>
        ) : !stats?.topSellingProducts?.length ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Chưa có đơn hàng ở trạng thái Hoàn thành (COMPLETED) trong kỳ đã chọn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase text-gray-600">
                  <th className="px-4 py-3">Hạng</th>
                  <th className="px-4 py-3">Món ăn</th>
                  <th className="px-4 py-3">Số lượng bán</th>
                  <th className="px-4 py-3 text-right">Doanh thu mang lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topSellingProducts.map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-[#FFF8F0]/50">
                    <td className="px-4 py-3.5 font-extrabold text-[#F47721]">#{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-[#262626]">{p.productName}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-700">
                      {p.totalQuantity} phần
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-[#1E2532]">
                      {formatCurrencyVnd(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
