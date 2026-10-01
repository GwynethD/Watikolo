import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAdminAuth();
  const backgroundImage = new URL('../../pictures/villa.png', import.meta.url).href;
  const [email, setEmail] = useState('admin@watikolo.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedRedirect = searchParams.get('redirect');
  const redirectTo = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('/admin/login')
    ? requestedRedirect
    : '/admin';

  useEffect(() => {
    setError('');
  }, [email, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      if (!(await login(email, password))) {
        setError('Invalid admin email or password.');
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09131e] px-4 py-10">
      <img src={backgroundImage} alt="Watikolo admin login" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/45" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[420px] rounded-xl border border-white/10 bg-[#1d2730]/70 px-8 py-8 text-white shadow-soft backdrop-blur-md"
      >
        <h1 className="text-3xl font-semibold">Admin Login</h1>
        <p className="mt-2 text-sm text-white/70">Sign in to manage bookings and events</p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-lg border border-white/10 bg-white px-4 text-sm text-[#1f2933] outline-none focus:ring-2 focus:ring-[#0f4da0]"
              aria-label="Admin email"
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-lg border border-white/10 bg-white px-4 pr-12 text-sm text-[#1f2933] outline-none focus:ring-2 focus:ring-[#0f4da0]"
                aria-label="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200/40 bg-red-500/20 px-4 py-3 text-sm text-red-50" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="mt-5 h-12 w-full rounded-lg bg-[#0f67c8] text-sm font-semibold text-white transition hover:bg-[#0b56ab] disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>

        <p className="mt-6 text-center text-xs text-white/35">© 2026 Watikolo</p>
      </form>
    </div>
  );
}
