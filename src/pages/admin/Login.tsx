import { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { BRAND } from '../../config';

interface Props {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: Props) {
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError('Invalid email or password');
      return;
    }
    onSuccess();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans md:flex-row">
      {/* PINK BRAND PANEL */}
      <div className="relative flex-shrink-0 overflow-hidden bg-rose px-7 py-10 md:flex md:flex-1 md:flex-col md:justify-between md:p-14">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10">
          <p className="font-serif text-[26px] font-medium leading-none text-white md:text-[34px]">
            {BRAND.name}
            <span className="opacity-70">.</span>
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/85 md:mt-3 md:text-[12px]">
            Admin
          </p>
        </div>

        <div className="relative z-10 mt-8 md:mt-0">
          <div className="mb-4 h-px w-16 bg-white/50 md:mb-6" />
          <h1 className="max-w-md font-serif text-[34px] font-medium italic leading-[1.1] text-white md:text-[46px]">
            Manage your store.
          </h1>
        </div>

        <p className="relative z-10 mt-8 hidden text-[12px] font-bold uppercase tracking-[0.24em] text-white/70 md:block">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>

      {/* WHITE FORM PANEL */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 md:w-[520px] md:flex-none md:py-16">
        <div className="w-full max-w-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">
            Welcome back
          </p>
          <h2 className="mt-3 font-serif text-[28px] font-medium leading-tight text-black md:mt-4 md:text-[34px]">
            Sign in to continue
          </h2>

          <form onSubmit={handleSubmit} className="mt-10 space-y-4 md:mt-12 md:space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-pink-line bg-white px-5 py-3.5 text-[14.5px] font-medium text-black placeholder:text-muted focus:border-rose focus:outline-none md:py-4"
                placeholder="you@cimmple.com"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-pink-line bg-white px-5 py-3.5 text-[14.5px] font-medium text-black placeholder:text-muted focus:border-rose focus:outline-none md:py-4"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-5 py-3.5 text-[13px] font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-full bg-black py-4 text-[13px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-400 ease-premium hover:bg-rose-deep disabled:opacity-60 md:mt-4 md:py-4"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-[12.5px] font-medium text-muted md:mt-10">
            Only authorised accounts can sign in.
          </p>
        </div>
      </div>
    </div>
  );
}