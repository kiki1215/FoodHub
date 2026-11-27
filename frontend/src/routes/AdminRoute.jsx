import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F4E5D7] border-t-[#F47721]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-500">
          403
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#262626]">Không có quyền truy cập</h2>
        <p className="mb-6 text-sm text-gray-600">
          Khu vực này chỉ dành cho tài khoản Quản trị viên (ADMIN).
        </p>
        <Link to="/" className="fh-btn-primary">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
