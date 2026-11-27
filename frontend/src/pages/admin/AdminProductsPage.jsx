import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../../components/admin/ConfirmModal';
import FoodImage from '../../components/common/FoodImage';
import { SearchIcon, TrashIcon } from '../../components/common/Icons';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { menuService } from '../../services/menuService';
import { formatCurrencyVnd } from '../../utils/formatters';

const STATUS_META = {
  AVAILABLE: { label: 'Còn hàng', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  OUT_OF_STOCK: { label: 'Hết hàng', cls: 'border-red-300 bg-red-50 text-red-700' },
  STOPPED: { label: 'Ngừng bán', cls: 'border-gray-300 bg-gray-100 text-gray-700' },
};

const INITIAL_FORM = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '50',
  imageUrl: '',
  categoryId: '',
  status: 'AVAILABLE',
  mealTimeTag: 'ALL_DAY',
};

const PAGE_SIZE = 8;

export default function AdminProductsPage() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const [productPage, setProductPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal Thêm / Sửa món ăn
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Modal Xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    adminService
      .getCategories()
      .then((res) => setCategories(res?.data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const trimmed = keyword.trim();

      // Nếu nhập mã sản phẩm (VD: SP001, sp1, #1, 001, 1) -> tìm trực tiếp theo ID sản phẩm
      if (trimmed && /^(#|sp)?\d+$/i.test(trimmed)) {
        const numericId = Number(trimmed.replace(/^(#|sp)/i, ''));
        try {
          const res = await menuService.getProductById(numericId);
          const item = res?.data;
          const matchCategory =
            !selectedCategoryId || Number(item?.categoryId) === Number(selectedCategoryId);
          const matchStatus = !statusFilter || item?.status === statusFilter;

          if (item && matchCategory && matchStatus) {
            setProductPage({
              content: [item],
              page: 0,
              totalPages: 1,
              totalElements: 1,
            });
          } else {
            setProductPage({ content: [], page: 0, totalPages: 0, totalElements: 0 });
          }
        } catch {
          setProductPage({ content: [], page: 0, totalPages: 0, totalElements: 0 });
        }
        return;
      }

      // Tìm theo tên món ăn qua API thật của Menu Service
      const res = await adminService.getProducts({
        keyword: trimmed || undefined,
        categoryId: selectedCategoryId ? Number(selectedCategoryId) : undefined,
        status: statusFilter || undefined,
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        sortDir: 'desc',
      });
      setProductPage(
        res?.data || { content: [], page: 0, totalPages: 0, totalElements: 0 }
      );
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách món ăn.');
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCategoryId, statusFilter, page, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleReset = () => {
    setSearchInput('');
    setKeyword('');
    setSelectedCategoryId('');
    setStatusFilter('');
    setPage(0);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      ...INITIAL_FORM,
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price ? String(prod.price) : '',
      stockQuantity: prod.stockQuantity != null ? String(prod.stockQuantity) : '50',
      imageUrl: prod.imageUrl || '',
      categoryId: prod.categoryId ? String(prod.categoryId) : '',
      status: prod.status || 'AVAILABLE',
      mealTimeTag: prod.mealTimeTag || 'ALL_DAY',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Tên món ăn phải từ 2 đến 150 ký tự';
    }
    const priceNum = Number(form.price);
    if (!form.price || Number.isNaN(priceNum) || priceNum < 1000) {
      next.price = 'Giá bán phải từ 1.000 VNĐ trở lên';
    }
    const stockNum = Number(form.stockQuantity);
    if (
      form.stockQuantity === '' ||
      Number.isNaN(stockNum) ||
      !Number.isInteger(stockNum) ||
      stockNum < 0 ||
      stockNum > 100000
    ) {
      next.stockQuantity = 'Số lượng có sẵn phải là số nguyên từ 0 đến 100.000';
    }
    if (!form.categoryId) {
      next.categoryId = 'Vui lòng chọn danh mục cho món ăn';
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    setUploadingImg(true);
    try {
      const res = await adminService.uploadProductImage(file);
      if (res?.data?.imageUrl) {
        setForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
        toast.success('Đã tải ảnh món ăn lên thành công!');
      }
    } catch (err) {
      toast.error(err?.message || 'Tải ảnh thất bại.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        imageUrl: form.imageUrl.trim() || null,
        categoryId: Number(form.categoryId),
        status: Number(form.stockQuantity) === 0 && form.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : form.status,
        mealTimeTag: form.mealTimeTag || 'ALL_DAY',
      };

      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, payload);
        toast.success('Cập nhật món ăn thành công!');
      } else {
        await adminService.createProduct(payload);
        toast.success('Thêm món ăn mới thành công!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      if (err?.fieldErrors) {
        setFormErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      toast.error(err?.message || 'Lưu thông tin món ăn thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (prod, newStatus) => {
    if (newStatus === prod.status) return;
    try {
      await adminService.updateProductStatus(prod.id, newStatus);
      toast.success(`Đã đổi trạng thái "${prod.name}" sang ${STATUS_META[newStatus]?.label}.`);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái kinh doanh.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await adminService.deleteProduct(deleteTarget.id);
      toast.success(`Đã xóa món "${deleteTarget.name}".`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      setDeleteError(err?.message || 'Không thể xóa món ăn này.');
    } finally {
      setDeleting(false);
    }
  };

  const startIdx = productPage.totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIdx = Math.min((page + 1) * PAGE_SIZE, productPage.totalElements);

  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#1E2532]">
        QUẢN LÝ MÓN ĂN
      </h1>

      {/* Thanh tìm kiếm theo tên món hoặc mã sản phẩm, lọc, nút Làm mới & nút Thêm mới */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên món hoặc mã SP (VD: Phở, SP001)..."
              className="fh-input pl-10"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm món ăn"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F47721]"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setPage(0);
            }}
            className="fh-input w-48"
          >
            <option value="">Danh mục: Tất cả</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="fh-input w-44"
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="AVAILABLE">Còn hàng</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
            <option value="STOPPED">Ngừng bán</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#262626] shadow-xs transition hover:border-[#F47721] hover:text-[#F47721]"
          >
            ↻ Làm mới
          </button>
        </div>

        <button type="button" onClick={openCreateModal} className="fh-btn-primary py-2.5">
          + Thêm mới
        </button>
      </div>

      {/* Dãy Tab Danh mục nhanh bám sát admin-products.png */}
      <div className="mt-4 flex flex-wrap items-center gap-5 border-b border-gray-200 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryId('');
            setPage(0);
          }}
          className={`border-b-2 pb-2.5 transition ${
            !selectedCategoryId
              ? 'border-[#F47721] font-bold text-[#F47721]'
              : 'border-transparent text-gray-600 hover:text-[#262626]'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => {
          const active = String(selectedCategoryId) === String(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(String(cat.id));
                setPage(0);
              }}
              className={`border-b-2 pb-2.5 transition ${
                active
                  ? 'border-[#F47721] font-bold text-[#F47721]'
                  : 'border-transparent text-gray-600 hover:text-[#262626]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Bảng dữ liệu món ăn bám sát admin-products.png */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-xs">
        {loading ? (
          <div className="py-14 text-center text-sm text-gray-500">
            Đang tải danh sách món ăn...
          </div>
        ) : productPage.content.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-500">
            Không tìm thấy món ăn nào phù hợp.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/90 text-xs font-bold text-gray-700">
                    <th className="px-4 py-3.5">Mã sản phẩm</th>
                    <th className="px-4 py-3.5">Tên món ăn</th>
                    <th className="px-4 py-3.5">Danh mục</th>
                    <th className="px-4 py-3.5">Giá bán</th>
                    <th className="px-4 py-3.5 text-center">Số lượng có sẵn</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productPage.content.map((prod) => {
                    const st = STATUS_META[prod.status] || STATUS_META.AVAILABLE;
                    return (
                      <tr key={prod.id} className="transition hover:bg-[#FFF8F0]/50">
                        <td className="px-4 py-3.5 font-semibold text-gray-600">
                          SP{String(prod.id).padStart(3, '0')}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-[#FFF8F0]">
                              <FoodImage
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="h-full w-full"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-[#262626]">{prod.name}</p>
                              <p className="text-xs text-gray-500">
                                Đã bán: {prod.soldCount ?? 0}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{prod.categoryName || '—'}</td>
                        <td className="px-4 py-3.5 font-bold text-[#262626]">
                          {formatCurrencyVnd(prod.price)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              (prod.stockQuantity ?? 0) <= 0
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : (prod.stockQuantity ?? 0) <= 10
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {prod.stockQuantity ?? 0} phần
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Trạng thái ${prod.name}`}
                            value={prod.status}
                            onChange={(e) => handleQuickStatusChange(prod, e.target.value)}
                            className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none ${st.cls}`}
                          >
                            <option value="AVAILABLE">Còn hàng</option>
                            <option value="OUT_OF_STOCK">Hết hàng</option>
                            <option value="STOPPED">Ngừng bán</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(prod)}
                              title="Chỉnh sửa món ăn"
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
                                setDeleteTarget(prod);
                              }}
                              title="Xóa món ăn"
                              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Phân trang */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5 text-xs text-gray-500">
              <span>
                Hiển thị {startIdx}-{endIdx} trên {productPage.totalElements} sản phẩm
              </span>

              {productPage.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white font-bold text-gray-600 hover:border-[#F47721] disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: productPage.totalPages }).map((_, idx) => (
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
                    disabled={page >= productPage.totalPages - 1}
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

      {/* Modal Thêm / Sửa Món ăn */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <form
            onSubmit={handleSaveProduct}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <h2 className="text-xl font-extrabold text-[#1E2532]">
              {editingProduct ? 'CHỈNH SỬA MÓN ĂN' : 'THÊM MÓN ĂN MỚI'}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Tên món ăn *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setFormErrors((p) => ({ ...p, name: '' }));
                  }}
                  placeholder="Ví dụ: Cơm tấm sườn nướng..."
                  className={`fh-input ${formErrors.name ? 'border-red-400' : ''}`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#262626]">Danh mục *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, categoryId: e.target.value }));
                    setFormErrors((p) => ({ ...p, categoryId: '' }));
                  }}
                  className={`fh-input ${formErrors.categoryId ? 'border-red-400' : ''}`}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="mt-1 text-xs font-medium text-red-600">{formErrors.categoryId}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Giá bán (VNĐ) *
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={form.price}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, price: e.target.value }));
                    setFormErrors((p) => ({ ...p, price: '' }));
                  }}
                  placeholder="Ví dụ: 55000"
                  className={`fh-input ${formErrors.price ? 'border-red-400' : ''}`}
                />
                {formErrors.price && (
                  <p className="mt-1 text-xs font-medium text-red-600">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Số lượng có sẵn *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  value={form.stockQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((p) => {
                      const num = Number(val);
                      let nextStatus = p.status;
                      if (val !== '' && !Number.isNaN(num)) {
                        if (num === 0 && p.status === 'AVAILABLE') {
                          nextStatus = 'OUT_OF_STOCK';
                        } else if (num > 0 && p.status === 'OUT_OF_STOCK') {
                          nextStatus = 'AVAILABLE';
                        }
                      }
                      return { ...p, stockQuantity: val, status: nextStatus };
                    });
                    setFormErrors((p) => ({ ...p, stockQuantity: '' }));
                  }}
                  placeholder="Ví dụ: 50"
                  className={`fh-input ${formErrors.stockQuantity ? 'border-red-400' : ''}`}
                />
                {formErrors.stockQuantity && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {formErrors.stockQuantity}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Trạng thái kinh doanh
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className="fh-input"
                >
                  <option value="AVAILABLE">Còn hàng (AVAILABLE)</option>
                  <option value="OUT_OF_STOCK">Hết hàng (OUT_OF_STOCK)</option>
                  <option value="STOPPED">Ngừng bán (STOPPED)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Khung giờ phục vụ (AI Tag)
                </label>
                <select
                  value={form.mealTimeTag}
                  onChange={(e) => setForm((p) => ({ ...p, mealTimeTag: e.target.value }))}
                  className="fh-input"
                >
                  <option value="ALL_DAY">Cả ngày (ALL_DAY)</option>
                  <option value="MORNING">Bữa sáng (MORNING)</option>
                  <option value="LUNCH">Bữa trưa (LUNCH)</option>
                  <option value="AFTERNOON">Bữa xế / chiều (AFTERNOON)</option>
                  <option value="DINNER">Bữa tối (DINNER)</option>
                </select>
              </div>

              {/* Upload ảnh từ máy hoặc nhập URL */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#262626]">
                  Hình ảnh món ăn (Tải tệp lên hoặc dán URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://... hoặc tải tệp ảnh từ máy"
                    className="fh-input flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImg}
                    onClick={() => fileInputRef.current?.click()}
                    className="fh-btn-outline shrink-0 px-3.5 text-xs"
                  >
                    {uploadingImg ? 'Đang tải...' : 'Chọn ảnh'}
                  </button>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 h-24 w-36 overflow-hidden rounded-xl border border-gray-200 bg-[#FFF8F0]">
                    <FoodImage src={form.imageUrl} alt="Xem trước" className="h-full w-full" />
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-[#262626]">Mô tả món ăn</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả hương vị, thành phần món ăn..."
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
                {saving ? 'Đang lưu...' : editingProduct ? 'Lưu cập nhật' : 'Thêm món ăn'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa món ăn"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa món "${deleteTarget.name}" khỏi thực đơn? Thao tác này không thể hoàn tác.`
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
