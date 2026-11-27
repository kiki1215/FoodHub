import { Link } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';
import { formatCurrencyVnd } from '../../utils/formatters';
import FoodImage from '../common/FoodImage';

const STATUS_META = {
  AVAILABLE: { label: 'Còn hàng', badgeCls: 'bg-emerald-500/90 text-white', canOrder: true },
  OUT_OF_STOCK: { label: 'Hết hàng', badgeCls: 'bg-amber-600/95 text-white', canOrder: false },
  STOPPED: { label: 'Ngừng bán', badgeCls: 'bg-neutral-700/95 text-white', canOrder: false },
};

export default function ProductCard({
  product,
  adding = false,
  onAddToCart,
  mode = 'catalog', // 'catalog' | 'bestseller' | 'ai-home'
}) {
  const statusInfo = STATUS_META[product.status] || STATUS_META.AVAILABLE;

  const handleTrackClick = () => {
    recommendationService.trackInteraction(product.id, 'CLICK_PRODUCT');
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#F4E5D7]/60 bg-white p-3 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Khung ảnh tỷ lệ chuẩn 16:10 không méo, có fallback */}
      <Link
        to={`/products/${product.id}`}
        onClick={handleTrackClick}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#FDF3E7]"
      >
        <FoodImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />

        {product.status !== 'AVAILABLE' ? (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${statusInfo.badgeCls}`}
          >
            {statusInfo.label}
          </span>
        ) : product.categoryName ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {product.categoryName}
          </span>
        ) : null}

        {product.aiMatchPercent ? (
          <span className="absolute right-2 top-2 rounded-full bg-[#F47721] px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
            ✨ {product.aiMatchPercent}%
          </span>
        ) : null}
      </Link>

      {/* Thông tin món */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/products/${product.id}`}
              onClick={handleTrackClick}
              className="line-clamp-1 text-sm font-bold text-[#262626] transition hover:text-[#F47721]"
              title={product.name}
            >
              {product.name}
            </Link>
            <span className="shrink-0 text-xs font-bold text-amber-500">★ 4.8</span>
          </div>

          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm font-extrabold text-[#F47721]">
              {formatCurrencyVnd(product.price)}
            </p>
            <span className="text-[11px] font-medium text-gray-500">
              Đã bán {product.soldCount ?? 0}
            </span>
          </div>

          {product.aiReason ? (
            <p
              className="mt-1.5 line-clamp-1 rounded-lg bg-[#FFF8F0] px-2 py-1 text-[11px] font-semibold text-[#C85A11]"
              title={product.aiReason}
            >
              {product.aiReason}
            </p>
          ) : null}
        </div>

        {/* Nút thao tác bám sát home.png */}
        <div className="mt-3 flex items-center gap-2">
          {mode === 'ai-home' ? (
            <button
              type="button"
              disabled={!statusInfo.canOrder || adding}
              onClick={() => onAddToCart && onAddToCart(product)}
              className="w-full rounded-xl bg-[#F47721] py-2 text-xs font-bold text-white transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {!statusInfo.canOrder ? statusInfo.label : adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </button>
          ) : mode === 'bestseller' ? (
            <>
              <Link
                to={`/products/${product.id}`}
                onClick={handleTrackClick}
                className="flex-1 rounded-xl border border-[#F47721] bg-white py-2 text-center text-xs font-bold text-[#F47721] transition hover:bg-[#FFF8F0]"
              >
                Xem chi tiết
              </Link>
              {onAddToCart && (
                <button
                  type="button"
                  disabled={!statusInfo.canOrder || adding}
                  onClick={() => onAddToCart(product)}
                  className="flex-1 rounded-xl bg-[#F47721] py-2 text-xs font-bold text-white transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {!statusInfo.canOrder ? statusInfo.label : adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!statusInfo.canOrder || adding}
                onClick={() => onAddToCart && onAddToCart(product)}
                className="flex-1 rounded-xl bg-[#F47721] py-2 text-xs font-bold text-white transition hover:bg-[#E06510] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {!statusInfo.canOrder ? statusInfo.label : adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
              </button>
              <Link
                to={`/products/${product.id}`}
                onClick={handleTrackClick}
                className="rounded-xl border border-[#F4E5D7] bg-[#FFF8F0] px-3 py-2 text-xs font-bold text-[#262626] transition hover:border-[#F47721] hover:text-[#F47721]"
              >
                Chi tiết
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
