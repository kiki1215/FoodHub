import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOutIcon, UserIcon } from '../components/common/Icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { resolveImageUrl } from '../utils/formatters';

const NAV_ITEMS = [
  {
    to: '/admin',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    label: 'Quản lý người dùng',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 19C3.6 15.8 6 14 9 14C12 14 14.4 15.8 15 19" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.5 14.3C17.8 14.6 19.6 16.2 20.2 19" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/admin/products',
    label: 'Quản lý món ăn',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 3V11M5 3V8C5 9.65 6.35 11 8 11H6.5M9 3V8" strokeLinecap="round" />
        <path d="M7 11V21" strokeLinecap="round" />
        <path d="M16 3C18.2 3 19.5 5.2 19.5 8.5C19.5 11 18.2 12.5 16.5 12.8V21" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/admin/categories',
    label: 'Quản lý danh mục',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7C3 5.9 3.9 5 5 5H9.5L11.5 7.5H19C20.1 7.5 21 8.4 21 9.5V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V7Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/admin/orders',
    label: 'Quản lý đơn hàng',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4H5L7.4 15.2C7.6 16.2 8.5 17 9.6 17H18.4C19.4 17 20.3 16.3 20.5 15.3L22 8H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/admin/revenue',
    label: 'Doanh số',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20H20" strokeLinecap="round" />
        <rect x="6" y="12" width="3" height="6" rx="0.8" />
        <rect x="11" y="8" width="3" height="10" rx="0.8" />
        <rect x="16" y="5" width="3" height="13" rx="0.8" />
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất khỏi phiên quản trị.');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F4F0] text-[#262626]">
      {/* Top Header bám sát 4 ảnh mẫu Admin */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-xs sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Mở menu quản trị"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6H20M4 12H20M4 18H20" strokeLinecap="round" />
            </svg>
          </button>

          <Link to="/admin" className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight text-[#F47721]">FOODHUB</span>
            <span className="h-5 w-px bg-gray-300" />
            <span className="text-base font-extrabold tracking-wider text-[#1E2532]">ADMIN</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden rounded-xl border border-[#F4E5D7] bg-[#FFF8F0] px-3.5 py-1.5 text-xs font-bold text-[#F47721] transition hover:bg-[#F4E5D7]/60 sm:inline-block"
          >
            ← Xem trang cửa hàng
          </Link>

          <div className="flex items-center gap-2.5">
            {user?.avatarUrl ? (
              <img
                src={resolveImageUrl(user.avatarUrl)}
                alt={user.fullName}
                className="h-9 w-9 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                <UserIcon className="h-5 w-5" />
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="max-w-[150px] truncate text-sm font-bold text-[#262626]">
                {user?.fullName || 'Quản trị viên'}
              </p>
              <p className="text-[11px] font-medium text-gray-500">Quản trị hệ thống</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar màu xanh đậm (#1E2532) bám sát ảnh mẫu */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 flex w-64 flex-col justify-between bg-[#1E2532] p-4 text-gray-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#F47721] text-white shadow-md'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-300 transition hover:bg-red-500/20 hover:text-red-300"
            >
              <LogOutIcon className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Nội dung chính */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
