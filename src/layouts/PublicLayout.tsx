import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export function PublicLayout() {
  const location = useLocation();
  const isBookingFlow = location.pathname === '/booking' || location.pathname === '/booking/success';
  const logoImage = new URL('../pictures/watikolo-logo.png', import.meta.url).href;

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const elementId = location.hash.replace('#', '');

    const scrollToElement = () => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.requestAnimationFrame(scrollToElement);
  }, [location.hash, location.pathname]);

  return (
    <div className="public-layout app-shell min-h-screen bg-surface">
      {isBookingFlow ? (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-[1120px] items-center px-4 py-3">
            <img src={logoImage} alt="Watikolo logo" className="h-10 w-auto object-contain sm:h-12" />
          </div>
        </header>
      ) : (
        <Navbar />
      )}
      <main>
        <Outlet />
      </main>
      {isBookingFlow ? null : <Footer />}
    </div>
  );
}
