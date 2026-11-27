import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import foodPlatter from '../assets/food-platter.svg';
import Pagination from '../components/common/Pagination';
import { SearchIcon } from '../components/common/Icons';
import AiRecommendationSection from '../components/menu/AiRecommendationSection';
import CategoryBar from '../components/menu/CategoryBar';
import ProductCard from '../components/menu/ProductCard';
import ProductSkeletonGrid from '../components/menu/ProductSkeletonGrid';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { menuService } from '../services/menuService';

const PAGE_SIZE = 8;

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  // State cho Categories & Best Sellers
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [bestSellers, setBestSellers] = useState([]);
  const [loadingBest, setLoadingBest] = useState(true);
  const [bestError, setBestError] = useState('');

  // State bộ lọc & phân trang cho Danh sách món ăn
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOption, setSortOption] = useState('createdAt:desc');
  const [page, setPage] = useState(0);

  const [productPage, setProductPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [addingId, setAddingId] = useState(null);

  const fetchInitialMenuData = useCallback(async () => {
    setLoadingCategories(true);
    setLoadingBest(true);
    setBestError('');
    try {
      const [catRes, bestRes] = await Promise.all([
        menuService.getCategories(),
        menuService.getBestSellers(4),
      ]);
      setCategories(catRes?.data || []);
      setBestSellers(bestRes?.data || []);
    } catch (err) {
      setBestError(err?.message || 'Không thể tải danh mục và món bán chạy.');
    } finally {
      setLoadingCategories(false);
      setLoadingBest(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialMenuData();
  }, [fetchInitialMenuData]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError('');
    const [sortBy, sortDir] = sortOption.split(':');
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
      setProductsError(err?.message || 'Không thể tải danh sách món ăn từ máy chủ.');
    } finally {
      setLoadingProducts(false);
    }
  }, [keyword, selectedCategoryId, statusFilter, sortOption, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    setPage(0);
    const listEl = document.getElementById('danh-sach-mon');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setKeyword('');
    setSelectedCategoryId(null);
    setStatusFilter('');
    setSortOption('createdAt:desc');
    setPage(0);
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

  const hasActiveFilter = Boolean(keyword || selectedCategoryId || statusFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. HERO BANNER (bám sát home.png + yêu cầu tiêu đề/nút) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#E6630E] via-[#F47721] to-[#F89E37] px-6 py-8 text-white shadow-soft sm:px-12 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-36 w-36 rounded-full bg-black/5" />

        <div className="relative z-10 grid items-center gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              Giao nóng hổi • Chuẩn vị ngon
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl lg:text-[40px]">
              Đói bụng rồi? Đặt món ngay thôi!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/95 sm:text-base">
              Thực đơn phong phú từ cơm nóng, phở truyền thống đến đồ ăn nhanh và trà trái cây mát
              lạnh – đặt trực tuyến nhanh chóng, thanh toán COD an tâm.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-[#F47721] shadow-md transition hover:-translate-y-0.5 hover:bg-[#FFF8F0]"
              >
                Khám phá thực đơn
              </Link>
              <a
                href="#danh-sach-mon"
                className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Xem món ngay ↓
              </a>
            </div>
          </div>

          <div className="flex justify-center md:col-span-5">
            <img
              src={foodPlatter}
              alt="Món ăn nổi bật FOODHUB"
              className="h-44 w-auto object-contain drop-shadow-2xl sm:h-56"
            />
          </div>
        </div>
      </section>

      {/* 2. THANH DANH MỤC (lấy từ Menu Service) */}
      <section className="mt-7" aria-label="Danh mục món ăn">
        <CategoryBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          loading={loadingCategories}
        />
      </section>

      {/* 3. KHU VỰC AI GỢI Ý MÓN ĂN (bám sát home.png, có Fallback tự động sang Menu Service) */}
      <AiRecommendationSection
        variant="home"
        title="GỢI Ý MÓN ĂN"
        isAuthenticated={isAuthenticated}
        limit={4}
        addingId={addingId}
        onAddToCart={handleAddToCart}
      />

      {/* 4. MÓN BÁN CHẠY (lấy từ Menu Service) */}
      <section className="mt-10" aria-label="Món bán chạy">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase text-[#262626]">
            <span className="text-[#F47721]">🔥</span> MÓN BÁN CHẠY NHẤT
          </h2>
          <Link
            to="/products?sortBy=soldCount&sortDir=desc"
            className="text-xs font-bold text-[#F47721] transition hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        {loadingBest ? (
          <ProductSkeletonGrid count={4} />
        ) : bestError ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
            <p className="text-sm font-medium text-red-600">{bestError}</p>
            <button
              type="button"
              onClick={fetchInitialMenuData}
              className="fh-btn-outline mt-3 text-xs"
            >
              Thử tải lại
            </button>
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Chưa có dữ liệu món bán chạy.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                mode="bestseller"
                adding={addingId === item.id}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. DANH SÁCH MÓN ĂN (tìm kiếm, lọc danh mục, lọc trạng thái, phân trang) */}
      <section id="danh-sach-mon" className="mt-11 scroll-mt-20 pb-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold uppercase text-[#262626]">
            CÁC MÓN ĂN CỦA CỬA HÀNG
          </h2>
          <Link
            to="/products"
            className="text-xs font-bold text-[#F47721] transition hover:underline"
          >
            Mở trang Thực đơn đầy đủ →
          </Link>
        </div>

        {/* Thanh tìm kiếm & lọc trực tiếp */}
        <div className="mb-6 rounded-2xl border border-[#F4E5D7] bg-white p-4 shadow-sm">
          <form
            onSubmit={handleFilterSubmit}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12"
          >
            <div className="relative lg:col-span-4">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên món ăn..."
                className="fh-input pr-10"
              />
              <button
                type="submit"
                aria-label="Tìm món"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F47721]"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="lg:col-span-3">
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : null);
                  setPage(0);
                }}
                className="fh-input"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="fh-input"
              >
                <option value="">Mọi trạng thái</option>
                <option value="AVAILABLE">Đang bán</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
                <option value="STOPPED">Ngừng bán</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(0);
                }}
                className="fh-input"
              >
                <option value="createdAt:desc">Mới nhất</option>
                <option value="soldCount:desc">Bán chạy nhất</option>
                <option value="price:asc">Giá thấp → cao</option>
                <option value="price:desc">Giá cao → thấp</option>
              </select>
            </div>

            <div className="flex gap-2 lg:col-span-1">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#F47721] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#E06510]"
              >
                Lọc
              </button>
            </div>
          </form>

          {hasActiveFilter && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
              <span className="text-gray-500">
                Tìm thấy <strong className="text-[#262626]">{productPage.totalElements}</strong> món
                ăn phù hợp
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-bold text-[#F47721] hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Hiển thị Loading / Error / Empty / Data */}
        {loadingProducts ? (
          <ProductSkeletonGrid count={8} />
        ) : productsError ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-600">{productsError}</p>
            <button type="button" onClick={fetchProducts} className="fh-btn-primary mt-4 text-xs">
              Thử lại
            </button>
          </div>
        ) : productPage.content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#F4E5D7] bg-white p-12 text-center shadow-sm">
            <p className="text-base font-bold text-[#262626]">
              Không tìm thấy món ăn nào phù hợp
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Hãy thử từ khóa khác hoặc đặt lại bộ lọc danh mục / trạng thái.
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="fh-btn-outline mt-4 text-xs"
              >
                Xem toàn bộ món ăn
              </button>
            )}
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
                setPage(nextPage);
                document
                  .getElementById('danh-sach-mon')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
