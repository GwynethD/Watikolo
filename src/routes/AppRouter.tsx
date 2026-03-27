import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { ManageBookingsPage } from '@/pages/admin/ManageBookingsPage';
import { ManageVenuesPage } from '@/pages/admin/ManageVenuesPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { ScheduleManagementPage } from '@/pages/admin/ScheduleManagementPage';
import { CustomerBookingsPage } from '@/pages/customer/CustomerBookingsPage';
import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboardPage';
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { BookingPage } from '@/pages/public/BookingPage';
import { BookingSuccessPage } from '@/pages/public/BookingSuccessPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { GalleryPage } from '@/pages/public/GalleryPage';
import { GuestReviewsPage } from '@/pages/public/GuestReviewsPage';
import { LandingPage } from '@/pages/public/LandingPage';
import { ThingsToDoPage } from '@/pages/public/ThingsToDoPage';
import { VenueDetailsPage } from '@/pages/public/VenueDetailsPage';
import { VenuesPage } from '@/pages/public/VenuesPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/things-to-do" element={<ThingsToDoPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/guest-reviews" element={<GuestReviewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/venues/:id" element={<VenueDetailsPage />} />
        <Route path="/venue/:id" element={<VenueDetailsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />
      </Route>

      <Route path="/dashboard" element={<CustomerLayout />}>
        <Route index element={<CustomerDashboardPage />} />
        <Route path="bookings" element={<CustomerBookingsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="venues" element={<ManageVenuesPage />} />
        <Route path="bookings" element={<ManageBookingsPage />} />
        <Route path="schedule" element={<ScheduleManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

