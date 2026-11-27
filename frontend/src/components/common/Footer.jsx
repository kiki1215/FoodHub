import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BowlLogoIcon } from './Icons';

const POLICY_CONTENT = {
  shipping: {
    title: 'Chính sách giao hàng FOODHUB',
    body: 'FOODHUB giao đồ ăn nóng hổi trong vòng 25 - 40 phút tại khu vực nội thành. Hỗ trợ thanh toán tiền mặt khi nhận hàng (COD), kiểm tra món trước khi thanh toán.',
  },
  privacy: {
    title: 'Chính sách bảo mật thông tin',
    body: 'Mọi mật khẩu người dùng đều được mã hóa một chiều bằng BCrypt. Thông tin cá nhân và lịch sử đặt hàng được bảo mật tuyệt đối, chỉ sử dụng cho mục đích giao nhận và gợi ý món ăn cá nhân hóa.',
  },
};

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState(null);

  return (
    <footer className="mt-auto border-t border-[#F4E5D7] bg-white text-[#262626]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* Giới thiệu */}
        <div>
          <Link to="/" className="mb-3 flex items-center gap-2">
            <BowlLogoIcon className="h-7 w-7" />
            <span className="text-xl font-extrabold text-[#F47721]">FOODHUB</span>
          </Link>
          <p className="text-sm leading-relaxed text-gray-600">
            Nền tảng đặt đồ ăn trực tuyến hiện đại, kết nối hàng trăm món ăn chuẩn vị Việt với gợi ý
            thông minh theo khẩu vị và khung giờ.
          </p>
        </div>

        {/* Điều hướng */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#262626]">
            Giới thiệu
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link to="/" className="transition hover:text-[#F47721]">
                Trang chủ FOODHUB
              </Link>
            </li>
            <li>
              <Link to="/products" className="transition hover:text-[#F47721]">
                Thực đơn hôm nay
              </Link>
            </li>
            <li>
              <Link to="/profile" className="transition hover:text-[#F47721]">
                Tài khoản cá nhân
              </Link>
            </li>
          </ul>
        </div>

        {/* Chính sách */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#262626]">
            Chính sách
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <button
                type="button"
                onClick={() => setActivePolicy('shipping')}
                className="text-left transition hover:text-[#F47721]"
              >
                Chính sách giao hàng
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setActivePolicy('privacy')}
                className="text-left transition hover:text-[#F47721]"
              >
                Chính sách bảo mật
              </button>
            </li>
          </ul>
        </div>

        {/* Liên hệ */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#262626]">
            Liên hệ
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Địa chỉ: Cầu Giấy, Hà Nội</li>
            <li>Hotline: 1900 6868 (07:00 – 22:30)</li>
            <li>Email: support@foodhub.local</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#F4E5D7]/70 bg-[#FFF8F0] py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} <span className="font-bold text-[#F47721]">FOODHUB</span> – Hệ
        thống Thương mại Điện tử Bán Đồ Ăn Trực Tuyến. Bảo lưu mọi quyền.
      </div>

      {activePolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setActivePolicy(null)}
        >
          <div
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-2 text-lg font-bold text-[#262626]">
              {POLICY_CONTENT[activePolicy].title}
            </h4>
            <p className="mb-5 text-sm leading-relaxed text-gray-600">
              {POLICY_CONTENT[activePolicy].body}
            </p>
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="fh-btn-primary w-full py-2.5"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
