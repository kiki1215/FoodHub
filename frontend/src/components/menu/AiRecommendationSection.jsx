import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';
import { formatCurrencyVnd } from '../../utils/formatters';
import FoodImage from '../common/FoodImage';
import ProductCard from './ProductCard';

const TIME_SLOT_LABELS = {
  MORNING: 'bữa sáng',
  LUNCH: 'bữa trưa',
  AFTERNOON: 'bữa xế chiều',
  DINNER: 'bữa tối',
};

function getStrategyBadge(strategy, timeSlot, isFallback, compact) {
  if (isFallback) {
    return compact ? 'Đề xuất phổ biến' : 'Món bán chạy đề xuất cho bạn';
  }
  if (strategy === 'HYBRID_PERSONALIZED') {
    return 'AI Cá nhân hóa theo khẩu vị của bạn';
  }
  if (strategy === 'CONTENT_SIMILAR') {
    return 'AI Gợi ý tương đồng';
  }
  const slotText = TIME_SLOT_LABELS[timeSlot] || 'khung giờ hiện tại';
  return `AI Gợi ý cho ${slotText}`;
}

export default function AiRecommendationSection({
  variant = 'home', // 'home' | 'similar'
  title,
  isAuthenticated = false,
  productId = null,
  categoryId = null,
  limit = 4,
  addingId = null,
  onAddToCart,
}) {
  const isCompact = variant === 'similar';
  const heading =
    title || (isCompact ? 'Món ăn kèm gợi ý cho bạn' : 'GỢI Ý MÓN ĂN DÀNH CHO BẠN');

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ strategy: '', timeSlot: null, isFallback: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      setLoading(true);
      try {
        const result = isCompact
          ? await recommendationService.getSimilarRecommendations({
              productId,
              categoryId,
              limit,
            })
          : await recommendationService.getHomeRecommendations({
              isAuthenticated,
              limit,
            });

        if (!active) return;
        setItems(result.items || []);
        setMeta({
          strategy: result.strategy || '',
          timeSlot: result.timeSlot || null,
          isFallback: Boolean(result.isFallback),
        });
      } catch {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (isCompact && !productId) {
      setLoading(false);
      return undefined;
    }

    loadRecommendations();
    return () => {
      active = false;
    };
  }, [isCompact, isAuthenticated, productId, categoryId, limit]);

  if (!loading && items.length === 0) {
    return null;
  }

  const badgeText = getStrategyBadge(meta.strategy, meta.timeSlot, meta.isFallback, isCompact);

  return (
    <section aria-label={heading} className={isCompact ? 'mt-7' : 'mt-9'}>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2
          className={`flex items-center gap-2 font-extrabold text-[#262626] ${
            isCompact ? 'text-base sm:text-lg' : 'text-lg uppercase'
          }`}
        >
          {!isCompact && (
            <span className="text-[#F47721]" aria-hidden="true">
              ✨
            </span>
          )}
          <span>{heading}</span>
        </h2>

        {!loading && (
          <span className="rounded-full border border-[#F47721]/30 bg-white px-3 py-1 text-[11px] font-semibold text-[#F47721]">
            {badgeText}
          </span>
        )}
      </div>

      {loading ? (
        <div
          className={
            isCompact
              ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
              : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'
          }
        >
          {Array.from({ length: limit }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-2xl border border-[#F4E5D7] bg-white p-3 shadow-sm"
            >
              <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-[#F4E5D7]/60" />
              <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded bg-[#F4E5D7]" />
              <div className="mt-2 h-3.5 w-2/5 animate-pulse rounded bg-[#F47721]/25" />
              {!isCompact && (
                <div className="mt-3 h-8 w-full animate-pulse rounded-xl bg-[#F47721]/20" />
              )}
            </div>
          ))}
        </div>
      ) : isCompact ? (
        /* Bố cục 4 thẻ nhỏ bám sát docs/ui-designs/product-detail.png */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/products/${item.id}`}
              onClick={() => recommendationService.trackInteraction(item.id, 'CLICK_PRODUCT')}
              title={item.aiReason ? `${item.name} — ${item.aiReason}` : item.name}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#F4E5D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#F47721]/60 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FDF3E7]">
                <FoodImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full transition duration-300 group-hover:scale-105"
                />
                {!meta.isFallback && item.aiMatchPercent ? (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-[#F47721]/95 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                    {item.aiMatchPercent}%
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col justify-between p-2.5">
                <div>
                  <p className="line-clamp-1 text-xs font-bold text-[#262626] transition group-hover:text-[#F47721]">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs font-extrabold text-[#F47721]">
                    {formatCurrencyVnd(item.price)}
                  </p>
                </div>

                {!meta.isFallback && item.aiReason ? (
                  <p className="mt-1 line-clamp-1 text-[10px] font-medium text-gray-500">
                    {item.aiReason}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Bố cục 4 thẻ chuẩn bám sát docs/ui-designs/home.png */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              mode="ai-home"
              adding={addingId === item.id}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
}
