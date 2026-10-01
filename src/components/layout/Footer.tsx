import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer>
      <div className="bg-[#2b2b2b] py-5 text-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap gap-10 px-4 text-[13px]">
          <Link to="/terms-and-conditions" className="hover:underline">
            Terms and Conditions
          </Link>
          <Link to="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-4 text-[13px] text-slate-500">
        Watikolo 2026 | All Rights Reserved
      </div>
    </footer>
  );
}


