import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FoodImage from '../components/common/FoodImage';
import { CartIcon } from '../components/common/Icons';
import AiRecommendationSection from '../components/menu/AiRecommendationSection';
import ProductCard from '../components/menu/ProductCard';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { menuService } from '../services/menuService';
import { recommendationService } from '../services/recommendationService';
import { formatCurrencyVnd } from '../utils/formatters';

const STATUS_BADGE = {
  AVAILABLE: {
    label: 'Còn hàng • Đang kinh doanh',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    canOrder: true,
  },
  OUT_OF_STOCK: {
    label: 'Tạm hết hàng',
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
    canOrder: false,
  },
  STOPPED: {
    label: 'Ngừng kinh doanh',
    cls: 'bg-gray-200 text-gray-700 border-gray-300',
    canOrder: false,
  },
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addingRelatedId, setAddingRelatedId] = useState(null);
  const lastTrackedViewRef = useRef(null);

  const loadProductDetail = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError('');
    setQuantity(1);

    try {
      const res = await menuService.getProductById(id);
      const prod = res?.data;
      if (!prod) {
        setNotFound(true);
        return;
      }
      setProduct(prod);

      // Lấy món ăn liên quan cùng danh mục từ Menu Service
      if (prod.categoryId) {
        const relRes = await menuService.getProducts({
          categoryId: prod.categoryId,
          page: 0,
          size: 5,
        });
        const list = (relRes?.data?.content || []).filter((p) => p.id !== prod.id).slice(0, 4);
        setRelatedProducts(list);
      } else {
        setRelatedProducts([]);
      }
    } catch (err) {
      if (err?.status === 404 || err?.status === 400) {
        setNotFound(true);
      } else {
        setError(err?.message || 'Không thể tải thông tin chi tiết món ăn.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProductDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadProductDetail]);

  // Tự động ghi nhận sự kiện VIEW_PRODUCT qua API Gateway khi khách xem chi tiết món ăn
  useEffect(() => {
    if (!product?.id || !isAuthenticated) return;
    const trackKey = `${product.id}`;
    if (lastTrackedViewRef.current === trackKey) return;
    lastTrackedViewRef.current = trackKey;
    recommendationService.trackInteraction(product.id, 'VIEW_PRODUCT');
  }, [product?.id, isAuthenticated]);

  const maxOrderableQty =
    product?.stockQuantity != null && product.stockQuantity > 0
      ? Math.min(99, product.stockQuantity)
      : 99;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(maxOrderableQty, prev + 1));
  };

  const handleAddToCartOnly = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm món vào giỏ hàng.');
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setSubmitting(true);
    try {
      await addToCart(product.id, quantity);
      toast.success(`Đã thêm ${quantity} phần "${product.name}" vào giỏ hàng!`);
    } catch (err) {
      toast.error(err?.message || 'Không thể thêm món vào giỏ hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Bấm "ĐẶT HÀNG": chuyển thẳng sang màn hình Checkout để xác nhận thành đơn hàng (KHÔNG lưu vào giỏ hàng)
  const handleOrderDirectly = () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để tiến hành đặt hàng.');
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    navigate('/checkout', {
      state: {
        directItem: {
          productId: product.id,
          productName: product.name,
          productImageUrl: product.imageUrl,
          unitPrice: product.price,
          quantity,
        },
      },
    });
  };

  const handleAddRelated = async (relItem) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm món vào giỏ hàng.');
      navigate('/login');
      return;
    }
    setAddingRelatedId(relItem.id);
    try {
      await addToCart(relItem.id, 1);
      toast.success(`Đã thêm "${relItem.name}" vào giỏ hàng!`);
    } catch (err) {
      toast.error(err?.message || 'Không thể thêm món vào giỏ hàng.');
    } finally {
      setAddingRelatedId(null);
    }
  };

  // Trạng thái Loading Skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-5 w-48 animate-pulse rounded bg-[#F4E5D7]" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-[#F4E5D7] lg:col-span-6" />
          <div className="space-y-4 lg:col-span-6">
            <div className="h-8 w-3/4 animate-pulse rounded bg-[#F4E5D7]" />
            <div className="h-7 w-1/3 animate-pulse rounded bg-[#F4E5D7]" />
            <div className="h-20 w-full animate-pulse rounded bg-[#F4E5D7]/70" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[#F4E5D7]" />
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái 404 Sản phẩm không tồn tại
  if (notFound) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-3xl bg-white p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8F0] text-2xl font-extrabold text-[#F47721]">
          404
        </div>
        <h1 className="text-xl font-extrabold text-[#262626]">Món ăn không tồn tại</h1>
        <p className="mt-2 text-sm text-gray-500">
          Món ăn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi thực đơn.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="fh-btn-outline">
            ← Quay lại
          </button>
          <Link to="/products" className="fh-btn-primary">
            Xem thực đơn
          </Link>
        </div>
      </div>
    );
  }

  // Trạng thái Error kết nối
  if (error || !product) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-3xl bg-white p-10 text-center shadow-card">
        <p className="text-base font-bold text-red-600">
          {error || 'Đã xảy ra lỗi khi tải thông tin món ăn.'}
        </p>
        <button type="button" onClick={loadProductDetail} className="fh-btn-primary mt-5">
          Thử tải lại
        </button>
      </div>
    );
  }

  const statusMeta = STATUS_BADGE[product.status] || STATUS_BADGE.AVAILABLE;

  return (
    <div>
      {/* Thanh Breadcrumb bám sát product-detail.png */}
      <div className="border-b border-[#F4E5D7] bg-[#FDF3E7]/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 text-xs font-medium sm:px-6">
          <Link to="/" className="text-[#F47721] hover:underline">
            Trang chủ
          </Link>
          <span className="text-gray-400">/</span>
          {product.categoryId ? (
            <>
              <Link
                to={`/products?categoryId=${product.categoryId}`}
                className="text-[#F47721] hover:underline"
              >
                {product.categoryName || 'Danh mục'}
              </Link>
              <span className="text-gray-400">/</span>
            </>
          ) : null}
          <span className="font-semibold text-[#262626]">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {/* Nút Quay lại */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#262626] transition hover:text-[#F47721]"
        >
          <span className="text-lg leading-none">‹</span> Quay lại
        </button>

        {/* Bố cục chính 2 cột bám sát product-detail.png */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Cột trái: Ảnh lớn của món ăn */}
          <div className="lg:col-span-6">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#F4E5D7] bg-white shadow-card">
              <FoodImage
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Cột phải: Thông tin món, chọn số lượng, nút thao tác & khung AI */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              {/* Danh mục & Trạng thái */}
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {product.categoryName && (
                  <Link
                    to={`/products?categoryId=${product.categoryId}`}
                    className="rounded-full bg-[#F4E5D7]/80 px-3 py-1 text-xs font-bold text-[#262626] transition hover:bg-[#F47721] hover:text-white"
                  >
                    {product.categoryName}
                  </Link>
                )}
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.cls}`}
                >
                  {statusMeta.label}
                </span>
              </div>

              {/* Tên món */}
              <h1 className="text-2xl font-extrabold text-[#262626] sm:text-3xl">
                {product.name}
              </h1>

              {/* Hàng Đánh giá / Lượt bán / Tồn kho + Giá bán VNĐ bên phải */}
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="font-bold text-amber-500">★ 4.8</span>
                  <span>•</span>
                  <span>Đã bán {product.soldCount ?? 0} phần</span>
                  {product.stockQuantity != null && (
                    <>
                      <span>•</span>
                      <span
                        className={`font-semibold ${
                          product.stockQuantity > 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        Có sẵn {product.stockQuantity} phần
                      </span>
                    </>
                  )}
                </div>
                <p className="text-2xl font-extrabold text-[#F47721] sm:text-3xl">
                  {formatCurrencyVnd(product.price)}
                </p>
              </div>

              {/* Mô tả */}
              <p className="mt-4 text-sm leading-relaxed text-gray-700 sm:text-base">
                {product.description ||
                  'Món ăn được chế biến nóng hổi từ nguyên liệu tươi ngon mỗi ngày tại FOODHUB.'}
              </p>

              {/* Bộ chọn số lượng + Nút Đặt hàng + Nút Thêm vào giỏ (bám sát product-detail.png) */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!statusMeta.canOrder || quantity <= 1}
                    onClick={handleDecrease}
                    aria-label="Giảm số lượng"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F47721]/50 bg-[#FFF8F0] text-lg font-bold text-[#F47721] transition hover:bg-[#F4E5D7] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-[28px] text-center text-base font-extrabold text-[#262626]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!statusMeta.canOrder || quantity >= maxOrderableQty}
                    onClick={handleIncrease}
                    aria-label="Tăng số lượng"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F47721] bg-white text-lg font-bold text-[#F47721] transition hover:bg-[#FFF8F0] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!statusMeta.canOrder || submitting}
                  onClick={handleOrderDirectly}
                  className="flex-1 rounded-xl bg-[#F47721] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {!statusMeta.canOrder ? statusMeta.label : 'ĐẶT HÀNG'}
                </button>

                <button
                  type="button"
                  disabled={!statusMeta.canOrder || submitting}
                  onClick={handleAddToCartOnly}
                  title="Thêm vào giỏ hàng"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#F47721] bg-white px-4 text-xs font-extrabold text-[#F47721] transition hover:bg-[#FFF8F0] disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                >
                  <CartIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {submitting ? 'Đang thêm...' : 'Thêm vào giỏ'}
                  </span>
                </button>
              </div>

              {!statusMeta.canOrder && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
                  Món ăn này hiện <strong>{statusMeta.label.toLowerCase()}</strong>. Bạn có thể tham
                  khảo các món tương tự bên dưới.
                </p>
              )}

              {/* Gợi ý AI món tương tự / ăn kèm (bám sát product-detail.png, có Fallback tự động) */}
              <AiRecommendationSection
                variant="similar"
                title="Món ăn kèm gợi ý cho bạn"
                productId={product.id}
                categoryId={product.categoryId}
                limit={4}
              />
            </div>
          </div>
        </div>

        {/* Khu vực Món liên quan cùng danh mục */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-[#F4E5D7] pt-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold uppercase text-[#262626]">
                MÓN ĂN CÙNG DANH MỤC ({product.categoryName})
              </h2>
              <Link
                to={`/products?categoryId=${product.categoryId}`}
                className="text-xs font-bold text-[#F47721] hover:underline"
              >
                Xem thêm →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  adding={addingRelatedId === rel.id}
                  onAddToCart={handleAddRelated}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
