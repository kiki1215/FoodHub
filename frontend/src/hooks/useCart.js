import { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return ctx;
}
