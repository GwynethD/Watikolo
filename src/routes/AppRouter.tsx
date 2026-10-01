import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { ManageBookingsPage } from '@/pages/admin/ManageBookingsPage';
import { InventoryPage } from '@/pages/admin/InventoryPage';
import { InventoryReportsPage } from '@/pages/admin/InventoryReportsPage';
import { ManageReviewsPage } from '@/pages/admin/ManageReviewsPage';
import { ManageVenuesPage } from '@/pages/admin/ManageVenuesPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { ScheduleManagementPage } from '@/pages/admin/ScheduleManagementPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { BookingPage } from '@/pages/public/BookingPage';
import { BookingSuccessPage } from '@/pages/public/BookingSuccessPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { GalleryPage } from '@/pages/public/GalleryPage';
import { GuestReviewsPage } from '@/pages/public/GuestReviewsPage';
import { LandingPage } from '@/pages/public/LandingPage';
import { PrivacyPolicyPage } from '@/pages/public/PrivacyPolicyPage';
import { TermsAndConditionsPage } from '@/pages/public/TermsAndConditionsPage';
import { ThingsToDoPage } from '@/pages/public/ThingsToDoPage';
import { VenueDetailsPage } from '@/pages/public/VenueDetailsPage';
import { VenuesPage } from '@/pages/public/VenuesPage';
import { RequireAdminAuth } from '@/routes/RequireAdminAuth';

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
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/venues/:id" element={<VenueDetailsPage />} />
        <Route path="/venue/:id" element={<VenueDetailsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<RequireAdminAuth />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="venues" element={<ManageVenuesPage />} />
          <Route path="bookings" element={<ManageBookingsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory-reports" element={<InventoryReportsPage />} />
          <Route path="reviews" element={<ManageReviewsPage />} />
          <Route path="schedule" element={<ScheduleManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

