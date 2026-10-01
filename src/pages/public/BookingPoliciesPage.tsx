import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

export function BookingPoliciesPage() {
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;
  const phoneNumber = '+63 915 874 8529';

  return (
    <PolicyPageLayout
      image={bannerImage}
      alt="Watikolo booking policies banner"
      title="Booking Policies"
      lastUpdated="April 16, 2026"
      description="These booking policies explain how reservations, deposits, and schedule confirmations work at Watikolo."
    >
      <div className="space-y-8 text-gray-700">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">1. Reservation Requests</h2>
          <p>
            Submitting a booking creates a reservation request for admin review. Your date and time slot are checked against existing bookings and
            availability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">2. Schedule Confirmation</h2>
          <p>
            Final confirmation depends on availability and the resort&apos;s review. If adjustments are needed, the resort team will contact you using the
            details you provide.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">3. Deposits and Payments</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>A 30% down payment is required to secure and confirm your booking once it has been approved.</li>
            <li>Payment instructions will be provided after review, depending on your selected payment method (e.g., GCash or bank transfer).</li>
            <li>Please keep your payment receipt or screenshot as proof of transaction for verification purposes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">4. Cancellations and No-Shows</h2>
          <p>
            Cancellation policies may vary depending on the package, selected date, and availability. The resort team will inform you of the applicable cancellation terms during the confirmation process.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">5. Contact</h2>
          <p>
            If you have questions before booking, contact Watikolo at <span className="font-semibold">{phoneNumber}</span>.
          </p>
        </section>
      </div>
    </PolicyPageLayout>
  );
}

