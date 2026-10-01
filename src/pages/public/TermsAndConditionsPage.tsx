import { Link } from 'react-router-dom';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

const policySections = [
  
  {
    title: '1. Scope of This Policy',
    paragraphs: [
      'These Terms and Conditions govern all use of the Watikolo website, venue, accommodations, and related services. This includes booking requests, confirmed reservations, event participation, and any on-site activities within the property.',
      'By accessing the website, submitting a booking, or entering the premises, you acknowledge that you have read, understood, and agreed to comply with these Terms, together with any additional guidelines, house rules, or instructions provided by the Watikolo management.',
    ],
  },
  {
    title: '2. Reservation Requests and Confirmation',
    paragraphs: [
      'All reservations are subject to availability, review, and approval by the Watikolo team. A booking request does not guarantee confirmation until it has been formally acknowledged.',
      'Guests must provide accurate and complete information including event type, number of attendees, preferred schedule, and any special requirements.',
    ],
    bullets: [
      'Watikolo reserves the right to decline or modify booking requests due to scheduling conflicts, capacity limits, or operational considerations.',
      'Confirmed reservations are only secured upon acknowledgment and receipt of the required deposit.',
      'Misrepresentation of booking details may result in cancellation or additional charges.',
    ],
  },
  {
    title: '3. Pricing, Payments, and Deposits',
    paragraphs: [
      'All rates are based on the latest pricing for venue rental, accommodations, packages, and add-ons at the time of booking.',
      'A 30% non-refundable downpayment is required to secure the reservation. Full payment terms will be communicated during or after booking confirmation.',
    ],
    bullets: [
      'Failure to settle payments within the given deadline may result in automatic cancellation of the reservation.',
      'Additional charges may apply for overtime, extra guests, equipment use, or special requests.',
      'Guests will be held financially responsible for any damages, losses, or excessive cleaning required during or after the event.',
    ],
  },
  {
    title: '4. Rescheduling and Cancellation Policy',
    paragraphs: [
      'Requests for rescheduling or cancellation must be made in advance through official communication channels.',
      'Approval of changes is subject to availability, updated pricing, and management discretion.',
    ],
    bullets: [
      'Deposits may be forfeited depending on the timing of cancellation.',
      'Rescheduling may only be allowed within a specified timeframe and may incur additional fees.',
      'No-shows or last-minute cancellations may result in full charge of the booking.',
    ],
  },
  {
    title: '5. Guest Conduct and Venue Rules',
    paragraphs: [
      'All guests are expected to maintain respectful behavior and comply with venue policies throughout their stay or event.',
      'The safety, comfort, and experience of all guests and staff must be prioritized at all times.',
    ],
    bullets: [
      'Strict adherence to maximum capacity limits is required.',
      'Illegal activities, hazardous behavior, or excessive disturbances are strictly prohibited.',
      'Watikolo reserves the right to remove individuals or terminate events that violate policies without refund.',
    ],
  },
  {
    title: '6. Resort Rules and Agreement',
    paragraphs: [
      'By entering the resort premises, guests agree to comply with the following rules and acknowledge responsibility for their actions during their stay.',
    ],
    bullets: [
      'Strictly no smoking inside the rooms.',
      'Children must be accompanied by an adult at all times, especially in the pool area.',
      'Strictly no diving or jumping in the pool.',
      'Swim at your own risk (no lifeguard).',
      'Avoid littering; dispose of trash properly within the resort premises.',
      'Prohibited drugs and firearms are not allowed. Guests caught will be reported to authorities immediately.',
      'Loss of any valuable item or damage to resort property will be charged accordingly.',
      'The resort management is not responsible for any lost, stolen, or damaged personal belongings.',
      'After using bath towels, kindly return them to the designated area.',
      'A 30% downpayment is required to secure reservation.',
      'Strictly no refund policy, but bookings may be rescheduled depending on availability.',
      'Clean as you go.',
      'For any concerns, please communicate directly with resort staff.',
    ],
  },
  {
    title: '7. Property Responsibility and Damages',
    paragraphs: [
      'Guests are fully responsible for maintaining the condition of the venue, rooms, and all provided equipment during their booking period.',
    ],
    bullets: [
      'Any damage, breakage, or loss will be charged accordingly.',
      'Decorations and setups must be approved to avoid damage to the property.',
      'Failure to report damages immediately may result in additional penalties.',
    ],
  },
  {
    title: '8. Website Use and Third-Party Services',
    paragraphs: [
      'The Watikolo website is provided for informational and booking purposes only. While we strive for accuracy, details such as pricing, availability, and inclusions may change without prior notice.',
      'Links to third-party platforms may be provided for convenience. Watikolo is not responsible for their content, policies, or service availability.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    paragraphs: [
      'Watikolo shall not be held liable for any indirect, incidental, or consequential damages arising from the use of the website, booking process, or venue services.',
      'This includes, but is not limited to, technical issues, third-party service disruptions, weather conditions, or unforeseen circumstances beyond reasonable control.',
    ],
  },
  {
    title: '10. Policy Updates',
    paragraphs: [
      'Watikolo reserves the right to modify these Terms and Conditions at any time to reflect operational, legal, or service changes.',
      'Continued use of the website or services after updates constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: '11. Contact Information',
    paragraphs: [
      'For inquiries, clarifications, or booking concerns, you may contact the Watikolo team through the official contact page or via phone.',
      'We strongly recommend reaching out before booking to ensure all details are properly aligned.',
    ],
  },
];

export function TermsAndConditionsPage() {
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

  return (
    <PolicyPageLayout
      image={bannerImage}
      alt="Watikolo terms and conditions banner"
      title="Terms and Conditions"
      lastUpdated="April 15, 2026"
      description="Please read these terms and conditions carefully before booking or using our services."
    >
      <div className="space-y-8">
        {policySections.map((section, index) => (
          <section
            key={section.title}
            className={index !== 0 ? 'border-t border-slate-200 pt-7' : ''}
          >
            <h2 className="text-xl font-semibold text-[#1f1f1f]">
              {section.title}
            </h2>

            <div className="mt-3 space-y-3 leading-relaxed text-gray-600 text-[14px]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {'bullets' in section && section.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600 text-[14px]">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="border-t border-slate-200 pt-7">
          <h2 className="text-xl font-semibold text-[#1f1f1f]">
            Contact Us
          </h2>

          <div className="mt-3 space-y-3 text-gray-600 text-[14px]">
            <p>If you have any questions, please contact us:</p>
            <p className="font-medium text-[#1f1f1f]">Phone: +63 915 874 8529</p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f4da0] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0b3f83]"
            >
              Contact Us
            </Link>

            <Link
              to="/booking"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:border-[#0f4da0] hover:text-[#0f4da0]"
            >
              Continue to Booking
            </Link>
          </div>
        </section>
      </div>
    </PolicyPageLayout>
  );
}
