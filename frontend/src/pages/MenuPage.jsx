import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchIcon } from '../components/common/Icons';
import Pagination from '../components/common/Pagination';
import CategoryBar from '../components/menu/CategoryBar';
import ProductCard from '../components/menu/ProductCard';
import ProductSkeletonGrid from '../components/menu/ProductSkeletonGrid';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { menuService } from '../services/menuService';

const PAGE_SIZE = 8;

export default function MenuPage() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('q') || '';
  const selectedCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : null;
  const statusFilter = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const page = Math.max(0, Number(searchParams.get('page') || 0));

  const [searchInput, setSearchInput] = useState(keyword);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [productPage, setProductPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    async function loadCats() {
      setLoadingCategories(true);
      try {
        const res = await menuService.getCategories();
        if (active) setCategories(res?.data || []);
      } catch {
        // Bỏ qua nếu lỗi nhẹ danh mục
      } finally {
        if (active) setLoadingCategories(false);
      }
    }
    loadCats();
    return () => {
      active = false;
    };
  }, []);

  const fetchMenuProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await menuService.getProducts({
        keyword: keyword || undefined,
        categoryId: selectedCategoryId || undefined,
        status: statusFilter || undefined,
        page,
        size: PAGE_SIZE,
        sortBy,
        sortDir,
      });
      setProductPage(
        res?.data || { content: [], page: 0, totalPages: 0, totalElements: 0 }
      );
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách thực đơn.');
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCategoryId, statusFilter, page, sortBy, sortDir]);

  useEffect(() => {
    fetchMenuProducts();
  }, [fetchMenuProducts]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim(), page: null });
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm món vào giỏ hàng.');
      navigate('/login');
      return;
    }
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    } catch (err) {
      toast.error(err?.message || 'Không thể thêm món vào giỏ hàng.');
    } finally {
      setAddingId(null);
    }
  };

  const hasFilter = Boolean(keyword || selectedCategoryId || statusFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* Header trang Thực đơn */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F47721] to-[#F89B34] px-6 py-7 text-white shadow-soft sm:px-10">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
          THỰC ĐƠN FOODHUB
        </h1>
        <p className="mt-1.5 text-sm text-white/95">
          Khám phá toàn bộ món ăn tươi ngon, tìm kiếm nhanh và lọc theo danh mục yêu thích.
        </p>
      </div>

      {/* Thanh Danh mục đồng bộ home.png */}
      <div className="mt-6">
        <CategoryBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(catId) => updateParams({ categoryId: catId, page: null })}
          loading={loadingCategories}
        />
      </div>

      {/* Bộ lọc tìm kiếm, trạng thái, sắp xếp */}
      <div className="mt-6 rounded-2xl border border-[#F4E5D7] bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12"
        >
          <div className="relative lg:col-span-5">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nhập tên món ăn cần tìm..."
              className="fh-input pr-10"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F47721]"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => updateParams({ status: e.target.value, page: null })}
              className="fh-input"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="AVAILABLE">Còn hàng (Đang bán)</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
              <option value="STOPPED">Ngừng kinh doanh</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [nextSortBy, nextSortDir] = e.target.value.split(':');
                updateParams({ sortBy: nextSortBy, sortDir: nextSortDir, page: null });
              }}
              className="fh-input"
            >
              <option value="createdAt:desc">Mới cập nhật</option>
              <option value="soldCount:desc">Bán chạy nhất</option>
              <option value="price:asc">Giá tăng dần</option>
              <option value="price:desc">Giá giảm dần</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#F47721] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#E06510]"
            >
              Tìm
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-xs text-gray-500">
          <span>
            Hiển thị <strong className="text-[#262626]">{productPage.content.length}</strong> trên
            tổng số <strong className="text-[#262626]">{productPage.totalElements}</strong> món ăn
          </span>
          {hasFilter && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="font-bold text-[#F47721] hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Kết quả món ăn */}
      <div className="mt-6 pb-8">
        {loading ? (
          <ProductSkeletonGrid count={8} />
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-red-600">{error}</p>
            <button type="button" onClick={fetchMenuProducts} className="fh-btn-primary mt-4 text-xs">
              Thử lại
            </button>
          </div>
        ) : productPage.content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#F4E5D7] bg-white p-12 text-center shadow-sm">
            <p className="text-base font-bold text-[#262626]">
              Không tìm thấy món ăn phù hợp với bộ lọc hiện tại
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Vui lòng thử từ khóa khác hoặc xem toàn bộ danh mục món ăn.
            </p>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="fh-btn-outline mt-4 text-xs"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {productPage.content.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  adding={addingId === item.id}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            <Pagination
              page={productPage.page}
              totalPages={productPage.totalPages}
              totalElements={productPage.totalElements}
              onPageChange={(nextPage) => {
                updateParams({ page: nextPage > 0 ? nextPage : null });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
