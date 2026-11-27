import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import MainLayout from '../layouts/MainLayout';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import MenuPage from '../pages/MenuPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminRevenuePage from '../pages/admin/AdminRevenuePage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

export const router = createBrowserRouter([
  // Phân hệ Khách hàng & Công khai (MainLayout)
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/products', element: <MenuPage /> },
      { path: '/products/:id', element: <ProductDetailPage /> },

      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },

      {
        element: <ProtectedRoute />,
        children: [
          { path: '/cart', element: <CartPage /> },
          { path: '/checkout', element: <CheckoutPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // Phân hệ Quản trị (AdminRoute + AdminLayout riêng biệt với Sidebar xanh đậm)
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'revenue', element: <AdminRevenuePage /> },
          { path: '*', element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
