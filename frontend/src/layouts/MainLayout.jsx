import { Outlet } from 'react-router-dom';
import Footer from '../components/common/Footer';
import Header from '../components/common/Header';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0] text-[#262626]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
