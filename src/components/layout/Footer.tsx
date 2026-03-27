import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#ece4d5] bg-[#fffdfa]">
      <div className="container-shell grid gap-8 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5fa7c9]">Watikolo</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink">A brighter resort booking experience for memorable stays and events.</h3>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
            Styled to feel more like a boutique tropical property while keeping your booking workflow and admin tools working behind the scenes.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Explore</h4>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Link to="/venues" className="block hover:text-ink">Venue listings</Link>
            <Link to="/booking" className="block hover:text-ink">Book a venue</Link>
            <Link to="/dashboard" className="block hover:text-ink">Customer dashboard</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Quick links</h4>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Link to="/" className="block hover:text-ink">Home</Link>
            <Link to="/venues" className="block hover:text-ink">Accommodations</Link>
            <Link to="/booking" className="block hover:text-ink">Book now</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


