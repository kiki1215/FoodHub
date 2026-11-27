import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthBanner from '../components/auth/AuthBanner';
import { EyeIcon, EyeOffIcon } from '../components/common/Icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { isValidEmail, isValidVietnamPhone } from '../utils/formatters';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Họ và tên phải từ 2 ký tự trở lên';
    }
    if (!form.phone.trim()) {
      next.phone = 'Số điện thoại không được để trống';
    } else if (!isValidVietnamPhone(form.phone)) {
      next.phone = 'SĐT không đúng định dạng Việt Nam (VD: 0912345678)';
    }
    if (!form.email.trim()) {
      next.email = 'Email không được để trống';
    } else if (!isValidEmail(form.email)) {
      next.email = 'Email không đúng định dạng';
    }
    if (!form.password || form.password.length < 6) {
      next.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    if (!form.confirmPassword) {
      next.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');
    try {
      await register({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim() || null,
        password: form.password,
      });
      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      if (err?.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      setApiError(err?.message || 'Đăng ký tài khoản thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-card md:grid-cols-12">
        {/* Cột trái bám sát register.png */}
        <div className="md:col-span-5">
          <AuthBanner
            titleLine1="Tham gia cùng"
            titleLine2="FOODHUB"
            subtitle="Gợi ý món ngon chuẩn gu bằng AI"
          />
        </div>

        {/* Cột phải Form Đăng ký 2 cột */}
        <div className="flex flex-col justify-center p-7 sm:p-10 md:col-span-7">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#262626] sm:text-3xl">
            ĐĂNG KÝ
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Đăng ký tài khoản để khám phá thế giới ẩm thực
          </p>

          {apiError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Họ và tên
                </label>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên..."
                  className={`fh-input ${errors.fullName ? 'border-red-400' : ''}`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Số điện thoại
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại..."
                  className={`fh-input ${errors.phone ? 'border-red-400' : ''}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập email..."
                  className={`fh-input ${errors.email ? 'border-red-400' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Địa chỉ
                </label>
                <input
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ..."
                  className="fh-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`fh-input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F47721]"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#262626]">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`fh-input pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F47721]"
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="fh-btn-primary mt-2 w-full py-3.5 uppercase"
            >
              {submitting ? 'Đang tạo tài khoản...' : 'ĐĂNG KÝ'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-[#F47721] transition hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
