import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthBanner from '../components/auth/AuthBanner';
import { EyeIcon, EyeOffIcon } from '../components/common/Icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { isValidEmail } from '../utils/formatters';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Email không đúng định dạng';
    }

    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');
    try {
      const loggedInUser = await login({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      });
      toast.success(`Xin chào ${loggedInUser.fullName}! Đăng nhập thành công.`);
      const redirectTo =
        location.state?.from?.pathname || (loggedInUser.role === 'ADMIN' ? '/admin' : '/');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err?.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      setApiError(err?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl bg-white shadow-card md:grid-cols-12">
        {/* Cột trái bám sát login.png */}
        <div className="md:col-span-5">
          <AuthBanner
            titleLine1="Chào mừng bạn đến"
            titleLine2="FOODHUB"
            subtitle="Đặt món ngon, giao siêu tốc!"
          />
        </div>

        {/* Cột phải Form Đăng nhập */}
        <div className="flex flex-col justify-center p-7 sm:p-10 md:col-span-7">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#262626] sm:text-3xl">
            ĐĂNG NHẬP
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Đăng nhập để tiếp tục đặt món ăn yêu thích của bạn
          </p>

          {apiError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#262626]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Nhập email tài khoản..."
                className={`fh-input ${errors.email ? 'border-red-400 focus:border-red-500' : ''}`}
              />
              {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-[#262626]"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`fh-input pr-11 ${
                    errors.password ? 'border-red-400 focus:border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#F47721]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[#262626]">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-[#F47721] focus:ring-[#F47721]"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info('Vui lòng liên hệ quản trị viên qua support@foodhub.local để hỗ trợ cấp lại mật khẩu.')
                }
                className="font-semibold text-[#F47721] transition hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" disabled={submitting} className="fh-btn-primary mt-2 w-full py-3.5 uppercase">
              {submitting ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-[#F47721] transition hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
