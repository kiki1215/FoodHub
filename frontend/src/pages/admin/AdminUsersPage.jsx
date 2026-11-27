import { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { LockIcon, SearchIcon, TrashIcon, UserIcon } from '../../components/common/Icons';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { isValidVietnamPhone, resolveImageUrl } from '../../utils/formatters';

const PAGE_SIZE = 8;

export default function AdminUsersPage() {
  const toast = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(0);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Xem chi tiết & Cập nhật khách hàng (KHÔNG hiển thị mật khẩu và KHÔNG cho đổi phân quyền)
  const [editingUser, setEditingUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal Xác nhận xóa tài khoản
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Chỉ lấy danh sách tài khoản Khách hàng (CUSTOMER)
      const res = await adminService.getUsers({
        role: 'CUSTOMER',
        active: activeFilter === '' ? undefined : activeFilter === 'true',
      });
      let list = res?.data || [];

      // Tìm kiếm theo mã người dùng (VD: 3, #3, 003, KH003)
      if (keyword) {
        const cleaned = keyword.replace(/^(#|kh)/i, '').trim();
        const numericId = Number(cleaned);
        if (!cleaned || Number.isNaN(numericId)) {
          list = [];
        } else {
          list = list.filter((u) => Number(u.id) === numericId);
        }
      }

      setUsers(list);
      setPage(0);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [keyword, activeFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput('');
    setKeyword('');
    setActiveFilter('');
    setPage(0);
  };

  const openUserDetailModal = async (u) => {
    setEditingUser(u);
    setFormErrors({});
    setLoadingDetail(true);
    try {
      const res = await adminService.getUserDetail(u.id);
      const detail = res?.data || u;
      setEditingUser(detail);
      setForm({
        fullName: detail.fullName || '',
        phone: detail.phone || '',
        address: detail.address || '',
        active: Boolean(detail.active),
      });
    } catch (err) {
      toast.error(err?.message || 'Không thể lấy chi tiết người dùng.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const next = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Họ và tên phải từ 2 ký tự trở lên';
    }
    if (form.phone.trim() && !isValidVietnamPhone(form.phone)) {
      next.phone = 'Số điện thoại không đúng định dạng Việt Nam';
    }
    setFormErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await adminService.updateUser(editingUser.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        active: form.active,
      });
      toast.success('Cập nhật thông tin khách hàng thành công!');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Cập nhật tài khoản thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (u) => {
    try {
      await adminService.updateUserStatus(u.id, !u.active);
      toast.success(
        u.active
          ? `Đã khóa tài khoản "${u.fullName}".`
          : `Đã mở khóa tài khoản "${u.fullName}".`
      );
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await adminService.deleteUser(deleteTarget.id);
      toast.success(`Đã xóa tài khoản "${deleteTarget.fullName}".`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      const msg = err?.message || 'Không thể xóa tài khoản này.';
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const totalElements = users.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const pagedUsers = users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const startIdx = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIdx = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#1E2532]">
        QUẢN LÝ NGƯỜI DÙNG
      </h1>

      {/* Thanh tìm kiếm theo mã người dùng, bộ lọc trạng thái & nút Làm mới */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo mã người dùng "
            className="fh-input pl-10"
          />
          <button
            type="submit"
            aria-label="Tìm theo mã người dùng"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F47721]"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </form>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="fh-input w-48"
        >
          <option value="">Trạng thái: Tất cả</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã bị khóa</option>
        </select>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#262626] shadow-xs transition hover:border-[#F47721] hover:text-[#F47721]"
        >
          ↻ Làm mới
        </button>
      </div>

      {/* Bảng danh sách khách hàng (đúng 5 cột như admin-users.png, không có cột Vai trò) */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-xs">
        {loading ? (
          <div className="py-14 text-center text-sm text-gray-500">
            Đang tải danh sách người dùng...
          </div>
        ) : pagedUsers.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-500">
            Không tìm thấy khách hàng nào phù hợp.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/90 text-xs font-bold text-gray-700">
                    <th className="px-4 py-3.5">Họ và tên</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Số điện thoại</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedUsers.map((u) => (
                    <tr key={u.id} className="transition hover:bg-[#FFF8F0]/50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={resolveImageUrl(u.avatarUrl)}
                              alt={u.fullName}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                              <UserIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#262626]">{u.fullName}</p>
                            <p className="text-[11px] text-gray-400">ID: #{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3.5 text-gray-700">{u.phone || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            u.active
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-red-300 bg-red-50 text-red-700'
                          }`}
                        >
                          {u.active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUserDetailModal(u)}
                            title="Xem chi tiết & Cập nhật"
                            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-gray-100 hover:text-[#F47721]"
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                            >
                              <path d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13" strokeLinecap="round" />
                              <path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" strokeLinejoin="round" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleLock(u)}
                            title={u.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"
                          >
                            <LockIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('');
                              setDeleteTarget(u);
                            }}
                            title="Xóa tài khoản"
                            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5 text-xs text-gray-500">
              <span>
                Hiển thị {startIdx}-{endIdx} trên {totalElements} người dùng
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 hover:border-[#F47721] disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
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
                    disabled={page >= totalPages - 1}
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

      {/* Modal Chi tiết & Cập nhật Khách hàng (Không có phân quyền và không hiển thị mật khẩu) */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setEditingUser(null)}
        >
          <form
            onSubmit={handleSaveUser}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <h2 className="text-lg font-extrabold text-[#1E2532]">
              CHI TIẾT & CẬP NHẬT NGƯỜI DÙNG #{editingUser.id}
            </h2>

            {loadingDetail ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Đang tải chi tiết tài khoản...
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-xl bg-[#FFF8F0] p-3.5 text-xs text-gray-700">
                  <p>
                    <strong>Email đăng nhập:</strong> {editingUser.email}
                  </p>
                  <p className="mt-1">
                    <strong>Giới tính:</strong> {editingUser.gender || 'Chưa cập nhật'} •{' '}
                    <strong>Ngày sinh:</strong> {editingUser.dateOfBirth || 'Chưa cập nhật'}
                  </p>
                  <p className="mt-1">
                    <strong>Ngày tạo:</strong>{' '}
                    {editingUser.createdAt
                      ? new Date(editingUser.createdAt).toLocaleString('vi-VN')
                      : '—'}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-[#262626]">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, fullName: e.target.value }));
                        setFormErrors((p) => ({ ...p, fullName: '' }));
                      }}
                      className={`fh-input ${formErrors.fullName ? 'border-red-400' : ''}`}
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-xs font-medium text-red-600">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#262626]">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, phone: e.target.value }));
                        setFormErrors((p) => ({ ...p, phone: '' }));
                      }}
                      className={`fh-input ${formErrors.phone ? 'border-red-400' : ''}`}
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-xs font-medium text-red-600">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#262626]">
                      Trạng thái tài khoản
                    </label>
                    <select
                      value={String(form.active)}
                      onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === 'true' }))}
                      className="fh-input"
                    >
                      <option value="true">Hoạt động bình thường</option>
                      <option value="false">Khóa tài khoản</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-[#262626]">Địa chỉ</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      className="fh-input"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditingUser(null)}
                    className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Đóng
                  </button>
                  <button type="submit" disabled={saving} className="fh-btn-primary py-2.5">
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* Modal xác nhận xóa tài khoản */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa tài khoản người dùng"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${deleteTarget.fullName}" ?`
            : ''
        }
        loading={deleting}
        errorMessage={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
