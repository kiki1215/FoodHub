import axiosClient from './axiosClient';
import { menuService } from './menuService';
import { getAccessToken, isJwtExpired } from '../utils/storage';

// Timeout ngắn (< 2 giây) đồng bộ với API Gateway để đảm bảo không làm chậm trải nghiệm đặt món
const AI_TIMEOUT_MS = 1800;

function hasValidSession() {
  const token = getAccessToken();
  return Boolean(token && !isJwtExpired(token));
}

async function hydrateProductsFromMenu(recItems = []) {
  if (!Array.isArray(recItems) || recItems.length === 0) {
    return [];
  }
  const ids = recItems.map((item) => Number(item.productId)).filter((id) => id > 0);
  if (ids.length === 0) {
    return [];
  }

  const menuRes = await menuService.getProductsByIds(ids);
  const products = Array.isArray(menuRes?.data) ? menuRes.data : [];
  const productMap = new Map(products.map((p) => [Number(p.id), p]));

  const hydrated = [];
  for (const rec of recItems) {
    const prod = productMap.get(Number(rec.productId));
    if (prod && prod.status === 'AVAILABLE') {
      const numericScore = Number(rec.score);
      const safeScore = Number.isFinite(numericScore) ? numericScore : 0.75;
      hydrated.push({
        ...prod,
        aiScore: safeScore,
        aiMatchPercent: Math.round(Math.min(0.99, Math.max(0.55, safeScore)) * 100),
        aiReason: rec.reason || 'Gợi ý phù hợp khẩu vị',
      });
    }
  }
  return hydrated;
}

export const recommendationService = {
  /**
   * Tự động gửi sự kiện hành vi người dùng qua API Gateway (fire-and-forget, không bao giờ ném lỗi).
   * User ID được API Gateway trích xuất trực tiếp từ JWT (X-User-Id), Frontend không gửi userId.
   */
  trackInteraction(productId, eventType) {
    if (!productId || !eventType || !hasValidSession()) {
      return Promise.resolve(null);
    }
    return axiosClient
      .post(
        '/recommendations/interactions',
        { productId: Number(productId), eventType },
        { timeout: AI_TIMEOUT_MS }
      )
      .catch(() => null);
  },

  /**
   * Gợi ý món ăn tại Trang chủ (/):
   * - Đã đăng nhập: gọi /api/recommendations/me (Hybrid cá nhân hóa hoặc Cold-Start theo khung giờ)
   * - Khách vãng lai: gọi /api/recommendations/time-based
   * - Fallback: nếu AI Service lỗi / timeout, tự động lấy món bán chạy từ Menu Service
   */
  async getHomeRecommendations({ isAuthenticated = false, limit = 4 } = {}) {
    try {
      const usePersonalEndpoint = isAuthenticated && hasValidSession();
      const endpoint = usePersonalEndpoint ? '/recommendations/me' : '/recommendations/time-based';
      const aiRes = await axiosClient.get(endpoint, {
        params: { limit },
        timeout: AI_TIMEOUT_MS,
      });

      const payload = aiRes?.data;
      const hydrated = await hydrateProductsFromMenu(payload?.items || []);
      if (hydrated.length > 0) {
        return {
          items: hydrated.slice(0, limit),
          strategy: payload?.strategy || 'TIME_SLOT_COLD_START',
          timeSlot: payload?.timeSlot || null,
          isFallback: false,
        };
      }
      throw new Error('Danh sách gợi ý AI rỗng sau khi đối chiếu thực đơn');
    } catch {
      // Fallback an toàn sang Menu Service (tuyệt đối không làm gián đoạn xem món / đặt hàng)
      const bestRes = await menuService.getBestSellers(limit, 'CURRENT');
      let fallbackList = Array.isArray(bestRes?.data) ? bestRes.data : [];
      if (fallbackList.length === 0) {
        const generalRes = await menuService.getBestSellers(limit);
        fallbackList = Array.isArray(generalRes?.data) ? generalRes.data : [];
      }
      return {
        items: fallbackList.slice(0, limit),
        strategy: 'FALLBACK_BEST_SELLERS',
        timeSlot: null,
        isFallback: true,
      };
    }
  },

  /**
   * Gợi ý món tương tự / ăn kèm tại trang Chi tiết món (/products/:id):
   * - Gọi /api/recommendations/similar/:id (TF-IDF Cosine Similarity + Time-slot)
   * - Fallback: nếu AI Service lỗi / timeout, lấy món cùng danh mục hoặc món bán chạy từ Menu Service
   */
  async getSimilarRecommendations({ productId, categoryId, limit = 4 } = {}) {
    const currentId = Number(productId);
    try {
      const aiRes = await axiosClient.get(`/recommendations/similar/${currentId}`, {
        params: { limit },
        timeout: AI_TIMEOUT_MS,
      });

      const payload = aiRes?.data;
      const hydrated = (await hydrateProductsFromMenu(payload?.items || [])).filter(
        (p) => Number(p.id) !== currentId
      );
      if (hydrated.length > 0) {
        return {
          items: hydrated.slice(0, limit),
          strategy: payload?.strategy || 'CONTENT_SIMILAR',
          timeSlot: payload?.timeSlot || null,
          isFallback: false,
        };
      }
      throw new Error('Không có món tương tự khả dụng từ AI Service');
    } catch {
      // Fallback sang món cùng danh mục hoặc món bán chạy từ Menu Service
      let fallbackItems = [];
      if (categoryId) {
        try {
          const catRes = await menuService.getProducts({
            categoryId,
            status: 'AVAILABLE',
            page: 0,
            size: limit + 2,
          });
          fallbackItems = (catRes?.data?.content || []).filter((p) => Number(p.id) !== currentId);
        } catch {
          fallbackItems = [];
        }
      }

      if (fallbackItems.length < limit) {
        const bestRes = await menuService.getBestSellers(limit + 2, 'CURRENT');
        const bestItems = (bestRes?.data || []).filter(
          (p) =>
            Number(p.id) !== currentId && !fallbackItems.some((ex) => Number(ex.id) === Number(p.id))
        );
        fallbackItems = [...fallbackItems, ...bestItems];
      }

      return {
        items: fallbackItems.slice(0, limit),
        strategy: 'FALLBACK_MENU',
        timeSlot: null,
        isFallback: true,
      };
    }
  },
};
