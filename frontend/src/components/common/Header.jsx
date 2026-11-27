import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { resolveImageUrl } from '../../utils/formatters';
import {
  BowlLogoIcon,
  CartIcon,
  ClockIcon,
  FileTextIcon,
  LocationIcon,
  LogOutIcon,
  SearchIcon,
  UserIcon,
} from './Icons';

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalQuantity } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setKeyword(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/products');
    }
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để xem và sử dụng giỏ hàng.');
      navigate('/login');
      return;
    }
    navigate('/cart');
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    toast.success('Đã đăng xuất tài khoản.');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#F4E5D7] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 transition hover:opacity-90">
            <BowlLogoIcon className="h-8 w-8 shrink-0" />
            <span className="text-2xl font-extrabold tracking-tight text-[#F47721]">FOODHUB</span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-semibold transition hover:text-[#F47721] ${
                  isActive ? 'text-[#F47721]' : 'text-[#262626]'
                }`
              }
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `text-sm font-semibold transition hover:text-[#F47721] ${
                  isActive ? 'text-[#F47721]' : 'text-[#262626]'
                }`
              }
            >
              Thực đơn
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#F47721] text-white'
                      : 'bg-[#FFF8F0] text-[#F47721] hover:bg-[#F4E5D7]'
                  }`
                }
              >
                Quản trị
              </NavLink>
            )}
          </nav>
        </div>

        {/* Center: Search bar */}
        <form onSubmit={handleSearchSubmit} className="hidden max-w-md flex-1 sm:block">
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm món ăn..."
              className="w-full rounded-full border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm text-[#262626] placeholder-gray-400 transition focus:border-[#F47721] focus:outline-none focus:ring-2 focus:ring-[#F47721]/20"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#F47721]"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Right: Cart, Account/Login, Location */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={handleCartClick}
            className="group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-[#262626] transition hover:bg-[#FFF8F0]"
          >
            <span className="relative text-[#F47721]">
              <CartIcon className="h-6 w-6" />
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#262626] px-1 text-[10px] font-bold text-white">
                {totalQuantity}
              </span>
            </span>
            <span className="hidden lg:inline">Giỏ hàng</span>
          </button>

          <div className="h-5 w-px bg-gray-200" />

          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[#262626] transition hover:bg-[#FFF8F0] hover:text-[#F47721]"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-[#F47721] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#E06510]"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-[#F4E5D7] bg-[#FFF8F0] py-1 pl-1.5 pr-3 text-sm font-semibold text-[#262626] transition hover:border-[#F47721]"
              >
                {user?.avatarUrl ? (
                  <img
                    src={resolveImageUrl(user.avatarUrl)}
                    alt={user.fullName}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F47721]/15 text-[#F47721]">
                    <UserIcon className="h-4 w-4" />
                  </span>
                )}
                <span className="max-w-[120px] truncate">{user?.fullName || 'Tài khoản'}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#F4E5D7] bg-white p-2 shadow-xl">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="truncate text-sm font-bold text-[#262626]">{user?.fullName}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#262626] transition hover:bg-[#FFF8F0] hover:text-[#F47721]"
                  >
                    <UserIcon className="h-4 w-4" />
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to="/profile?tab=orders"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#262626] transition hover:bg-[#FFF8F0] hover:text-[#F47721]"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    Lịch sử đặt hàng
                  </Link>
                  <Link
                    to="/profile?tab=tracking"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#262626] transition hover:bg-[#FFF8F0] hover:text-[#F47721]"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Theo dõi đơn hàng
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#262626] transition hover:bg-[#FFF8F0] hover:text-[#F47721]"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#F47721]" />
                      Trang quản trị (Admin)
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="hidden items-center gap-1 border-l border-gray-200 pl-4 text-sm font-medium text-[#262626] xl:flex">
            <LocationIcon className="h-4 w-4 text-[#262626]" />
            <span>Hà Nội</span>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <form onSubmit={handleSearchSubmit} className="border-t border-[#F4E5D7]/60 px-4 py-2 sm:hidden">
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm món ăn..."
            className="w-full rounded-full border border-gray-300 bg-white py-1.5 pl-4 pr-9 text-sm focus:border-[#F47721] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </header>
  );
}
