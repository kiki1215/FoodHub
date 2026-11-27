import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { recommendationService } from '../services/recommendationService';

export const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  totalItems: 0,
  totalQuantity: 0,
  totalAmount: 0,
};

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [cart, setCart] = useState(EMPTY_CART);
  const [loadingCart, setLoadingCart] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const applyCartData = useCallback((data) => {
    if (!data) {
      setCart(EMPTY_CART);
      setAppliedVoucher(null);
      return;
    }
    const nextCart = {
      items: data.items || [],
      totalItems: data.totalItems ?? (data.items ? data.items.length : 0),
      totalQuantity: data.totalQuantity ?? 0,
      totalAmount: data.totalAmount ?? 0,
    };
    setCart(nextCart);
    if (nextCart.items.length === 0) {
      setAppliedVoucher(null);
    }
  }, []);

  // Tự động tính lại giảm giá khi tạm tính giỏ hàng thay đổi
  useEffect(() => {
    let active = true;
    async function revalidate() {
      if (!appliedVoucher?.code) return;
      if (!cart.totalAmount || Number(cart.totalAmount) <= 0) {
        setAppliedVoucher(null);
        return;
      }
      try {
        const res = await orderService.validateVoucher(appliedVoucher.code, cart.totalAmount);
        if (active && res?.data) {
          setAppliedVoucher(res.data);
        }
      } catch {
        if (active) setAppliedVoucher(null);
      }
    }
    revalidate();
    return () => {
      active = false;
    };
  }, [cart.totalAmount, appliedVoucher?.code]);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      setAppliedVoucher(null);
      return EMPTY_CART;
    }
    setLoadingCart(true);
    try {
      const res = await cartService.getMyCart();
      applyCartData(res?.data);
      return res?.data || EMPTY_CART;
    } catch {
      return cart;
    } finally {
      setLoadingCart(false);
    }
  }, [isAuthenticated, applyCartData]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(EMPTY_CART);
      setAppliedVoucher(null);
    }
  }, [isAuthenticated, authLoading, fetchCart]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      setUpdatingProductId(productId);
      try {
        const res = await cartService.addItem(productId, quantity);
        applyCartData(res?.data);
        recommendationService.trackInteraction(productId, 'ADD_TO_CART');
        return res?.data;
      } finally {
        setUpdatingProductId(null);
      }
    },
    [applyCartData]
  );

  const increaseQuantity = useCallback(
    async (productId) => {
      setUpdatingProductId(productId);
      try {
        const res = await cartService.increaseItem(productId);
        applyCartData(res?.data);
        return res?.data;
      } finally {
        setUpdatingProductId(null);
      }
    },
    [applyCartData]
  );

  const decreaseQuantity = useCallback(
    async (productId) => {
      setUpdatingProductId(productId);
      try {
        const res = await cartService.decreaseItem(productId);
        applyCartData(res?.data);
        return res?.data;
      } finally {
        setUpdatingProductId(null);
      }
    },
    [applyCartData]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      setUpdatingProductId(productId);
      try {
        const res = await cartService.updateItemQuantity(productId, quantity);
        applyCartData(res?.data);
        return res?.data;
      } finally {
        setUpdatingProductId(null);
      }
    },
    [applyCartData]
  );

  const removeFromCart = useCallback(
    async (productId) => {
      setUpdatingProductId(productId);
      try {
        const res = await cartService.removeItem(productId);
        applyCartData(res?.data);
        return res?.data;
      } finally {
        setUpdatingProductId(null);
      }
    },
    [applyCartData]
  );

  const clearAllCart = useCallback(async () => {
    setLoadingCart(true);
    try {
      const res = await cartService.clearCart();
      applyCartData(res?.data);
      setAppliedVoucher(null);
      return res?.data;
    } finally {
      setLoadingCart(false);
    }
  }, [applyCartData]);

  const applyVoucher = useCallback(
    async (code) => {
      const res = await orderService.validateVoucher(code, cart.totalAmount);
      if (res?.data) {
        setAppliedVoucher(res.data);
      }
      return res?.data;
    },
    [cart.totalAmount]
  );

  const clearVoucher = useCallback(() => {
    setAppliedVoucher(null);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      items: cart.items,
      totalItems: cart.totalItems,
      totalQuantity: cart.totalQuantity,
      totalAmount: cart.totalAmount,
      appliedVoucher,
      loadingCart,
      updatingProductId,
      fetchCart,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      removeFromCart,
      clearAllCart,
      applyVoucher,
      clearVoucher,
    }),
    [
      cart,
      appliedVoucher,
      loadingCart,
      updatingProductId,
      fetchCart,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      removeFromCart,
      clearAllCart,
      applyVoucher,
      clearVoucher,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
