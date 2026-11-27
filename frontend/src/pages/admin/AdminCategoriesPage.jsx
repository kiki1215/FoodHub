import { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { SearchIcon, TrashIcon } from '../../components/common/Icons';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';

export default function AdminCategoriesPage() {
  const toast = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Thêm / Sửa danh mục
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal Xóa danh mục (hiển thị rõ lỗi ràng buộc từ Backend nếu còn món ăn)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCategories();
      let list = res?.data || [];

      // Tìm kiếm theo tên danh mục hoặc mã danh mục (VD: Cơm, DM001, 1)
      if (keyword) {
        const lower = keyword.toLowerCase();
        const cleanedCode = lower.replace(/^dm/i, '').trim();
        const numericId = cleanedCode && /^\d+$/.test(cleanedCode) ? Number(cleanedCode) : null;

        list = list.filter((cat) => {
          const codeStr = `dm${String(cat.id).padStart(3, '0')}`;
          const matchCode = codeStr.includes(lower) || (numericId !== null && Number(cat.id) === numericId);
          const matchName = (cat.name || '').toLowerCase().includes(lower);
          return matchCode || matchName;
        });
      }

      setCategories(list);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, [keyword, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput('');
    setKeyword('');
  };

  const openCreate = () => {
    setEditingCat(null);
    setForm({ name: '', description: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({ name: cat.name || '', description: cat.description || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormErrors({ name: 'Tên danh mục phải từ 2 đến 100 ký tự' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      if (editingCat) {
        await adminService.updateCategory(editingCat.id, payload);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await adminService.createCategory(payload);
        toast.success('Thêm danh mục mới thành công!');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      if (err?.fieldErrors) {
        setFormErrors((p) => ({ ...p, ...err.fieldErrors }));
      }
      toast.error(err?.message || 'Lưu danh mục thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await adminService.deleteCategory(deleteTarget.id);
      toast.success(`Đã xóa danh mục "${deleteTarget.name}".`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      const msg =
        err?.message ||
        'Không thể xóa danh mục đang được sử dụng bởi món ăn.';
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#1E2532]">
        QUẢN LÝ DANH MỤC
      </h1>

      {/* Thanh tìm kiếm theo tên/mã danh mục, nút Làm mới & Nút Thêm mới */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tên hoặc mã danh mục (VD: Cơm, DM001)"
              className="fh-input pl-10"
            />
            <button
              type="submit"
              aria-label="Tìm danh mục"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F47721]"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#262626] shadow-xs transition hover:border-[#F47721] hover:text-[#F47721]"
          >
            ↻ Làm mới
          </button>
        </div>

        <button type="button" onClick={openCreate} className="fh-btn-primary py-2.5">
          + Thêm danh mục
        </button>
      </div>

      {/* Bảng danh mục đồng bộ phong cách admin-products.png */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-xs">
        {loading ? (
          <div className="py-14 text-center text-sm text-gray-500">
            Đang tải danh sách danh mục...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-500">
            Không tìm thấy danh mục nào.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/90 text-xs font-bold text-gray-700">
                    <th className="px-4 py-3.5">Mã danh mục</th>
                    <th className="px-4 py-3.5">Tên danh mục</th>
                    <th className="px-4 py-3.5">Mô tả</th>
                    <th className="px-4 py-3.5 text-center">Số món ăn</th>
                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="transition hover:bg-[#FFF8F0]/50">
                      <td className="px-4 py-3.5 font-semibold text-gray-600">
                        DM{String(cat.id).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#262626]">{cat.name}</td>
                      <td className="max-w-md px-4 py-3.5 text-gray-600">
                        <span className="line-clamp-2">{cat.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block rounded-lg border border-orange-200 bg-[#FFF8F0] px-2.5 py-0.5 text-xs font-bold text-[#F47721]">
                          {cat.productCount ?? 0} món
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(cat)}
                            title="Chỉnh sửa danh mục"
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
                            onClick={() => {
                              setDeleteError('');
                              setDeleteTarget(cat);
                            }}
                            title="Xóa danh mục"
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

            <div className="border-t border-gray-100 px-5 py-3.5 text-xs text-gray-500">
              Tổng cộng {categories.length} danh mục sản phẩm
            </div>
          </>
        )}
      </div>

      {/* Modal Thêm / Sửa Danh mục */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <form
            onSubmit={handleSave}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-extrabold text-[#1E2532]">
              {editingCat ? 'CHỈNH SỬA DANH MỤC' : 'THÊM DANH MỤC MỚI'}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setFormErrors({});
                  }}
                  placeholder="Ví dụ: Lẩu & Nướng"
                  className={`fh-input ${formErrors.name ? 'border-red-400' : ''}`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#262626]">Mô tả</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả ngắn gọn về nhóm món ăn này..."
                  className="fh-input resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button type="submit" disabled={saving} className="fh-btn-primary py-2.5">
                {saving ? 'Đang lưu...' : editingCat ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal xác nhận xóa hiển thị rõ ràng buộc từ Backend */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa danh mục"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa danh mục "${deleteTarget.name}" (hiện có ${deleteTarget.productCount ?? 0} món ăn)?`
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
