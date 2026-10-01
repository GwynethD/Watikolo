import { Link } from 'react-router-dom';
import { PolicyPageLayout } from '@/components/common/PolicyPageLayout';

const policySections = [
  {
    title: '1. Introduction',
    paragraphs: [
      'This Privacy Policy explains how Watikolo collects, uses, and protects your personal information when you use our website, book our venue, or interact with our services.',
      'By using our website or submitting your information, you agree to the collection and use of data in accordance with this Privacy Policy.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: [
      'We may collect personal information that you provide directly when making a booking, inquiry, or account registration.',
    ],
    bullets: [
      'Full name',
      'Email address',
      'Phone number',
      'Booking details (event type, date, number of guests)',
      'Any additional information you voluntarily provide',
    ],
  },
  {
    title: '3. Automatically Collected Data',
    paragraphs: [
      'We may automatically collect certain technical data when you use our website to improve performance and user experience.',
    ],
    bullets: [
      'IP address',
      'Browser type and version',
      'Pages visited and time spent',
      'Device type and operating system',
    ],
  },
  {
    title: '4. Use of Your Information',
    paragraphs: [
      'Watikolo uses your personal data for the following purposes:',
    ],
    bullets: [
      'To process and manage bookings',
      'To communicate confirmations, updates, and inquiries',
      'To improve our website, services, and customer experience',
      'To send promotions or offers (only if you opt-in)',
      'To comply with legal obligations',
    ],
  },
  {
    title: '5. Cookies and Tracking Technologies',
    paragraphs: [
      'We use cookies and similar technologies to enhance your browsing experience and analyze website traffic.',
      'You may choose to disable cookies through your browser settings, but some features of the website may not function properly.',
    ],
  },
  {
    title: '6. Sharing of Information',
    paragraphs: [
      'We do not sell your personal data. However, we may share information in the following cases:',
    ],
    bullets: [
      'With service providers (e.g., payment processors, booking systems)',
      'When required by law or legal processes',
      'To protect our rights, property, or safety',
    ],
  },
  {
    title: '7. Data Retention',
    paragraphs: [
      'We retain your personal data only as long as necessary for business, legal, and operational purposes.',
      'Once no longer required, your data will be securely deleted or anonymized.',
    ],
  },
  {
    title: '8. Your Rights',
    paragraphs: [
      'You have the right to access, update, or request deletion of your personal data.',
      'You may contact us at any time to exercise your rights regarding your information.',
    ],
  },
  {
    title: '9. Data Security',
    paragraphs: [
      'We implement appropriate security measures to protect your personal data. However, no system is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    title: '10. Third-Party Links',
    paragraphs: [
      'Our website may contain links to third-party websites. We are not responsible for their privacy practices or content.',
    ],
  },
  {
    title: '11. Updates to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.',
    ],
  },
];

export function PrivacyPolicyPage() {
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

  return (
    <PolicyPageLayout
      image={bannerImage}
      alt="Watikolo privacy policy banner"
      title="Privacy Policy"
      lastUpdated="April 15, 2026"
      description="Learn how Watikolo collects, uses, and protects your personal information."
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
            <p>If you have any questions about this Privacy Policy, you may contact us:</p>
            <p className="font-medium text-[#1f1f1f]">Email: watikolo@email.com</p>
            <p className="font-medium text-[#1f1f1f]">Phone: +63 915 874 8529</p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-[#0f4da0] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0b3f83]"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </PolicyPageLayout>
  );
}
