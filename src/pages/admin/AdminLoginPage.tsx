import { ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/FormField';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@watikolo.com');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3e8_0%,#fbfaf7_38%,#f4efe4_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-soft lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[320px] overflow-hidden bg-[#2d2b2a] p-8 text-white sm:p-10">
          <img
            src="https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80"
            alt="Watikolo admin login"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(32,35,33,0.45)_0%,rgba(32,35,33,0.76)_100%)]" />
          <div className="relative z-10 max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#e7d8aa]">Admin Login</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-none">Control the resort booking system from one secure panel.</h1>
            <p className="mt-5 text-sm leading-7 text-slate-200">
              Use this admin entrance for venue management, booking approvals, schedules, and reports.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="inline-flex rounded-full bg-[#eef7fb] p-3 text-[#5fa7c9]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-ink">Welcome back</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Demo login only. Submitting this form will send you to the admin dashboard at <code>/admin</code>.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <InputField label="Admin email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <InputField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button className="w-full" type="submit">Sign in to admin</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
