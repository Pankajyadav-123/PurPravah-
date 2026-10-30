import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetSessionQueryKey,
  useAuthLogin,
  useAuthRegister,
} from '@/lib/api-client-react';
import { SiteHeader } from '@/components/app-shared';

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'sign-up';
  const [, navigate] = useLocation();
  const requestedReturnTo = new URLSearchParams(window.location.search).get('returnTo');
  const returnTo = requestedReturnTo?.startsWith('/')
    && !requestedReturnTo.startsWith('//')
    && !requestedReturnTo.startsWith('/\\')
    && !requestedReturnTo.startsWith('/sign-in')
    && !requestedReturnTo.startsWith('/sign-up')
    ? requestedReturnTo
    : '/';
  const queryClient = useQueryClient();
  const login = useAuthLogin();
  const register = useAuthRegister();
  const mutation = isSignUp ? register : login;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const session = await mutation.mutateAsync({
        data: isSignUp ? { name, email, password } : { email, password },
      });
      await queryClient.cancelQueries({ queryKey: getGetSessionQueryKey() });
      queryClient.clear();
      queryClient.setQueryData(getGetSessionQueryKey(), session);
      navigate(returnTo);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Please try again.');
    }
  };

  return (
    <div className="site-page-shell flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="auth-page grid flex-1 bg-[#e9eee4] md:grid-cols-[.95fr_1.05fr]">
        <section className="hidden overflow-hidden bg-[#1d4941] p-10 text-[#f6f2e7] md:flex md:flex-col md:justify-between">
          <Link href="/" className="font-display text-base font-extrabold text-[#f8f3e8]">
            PurPravah
          </Link>
        <div className="relative max-w-[500px]">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#e6a06b]">A clearer line to your city</div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-[-.06em]">
            Your local report.<br />Your city’s next step.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#c3d4ca]">
            Sign in to keep a clear record of reports, updates, and what happens next.
          </p>
        </div>
        </section>
        <section className="flex items-center justify-center p-5">
        <div className="w-full max-w-[420px]">
          <div className="card p-5 md:p-7">
            <h2 className="font-display text-2xl font-extrabold text-[#21443d]">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm leading-6 subtle">
              {isSignUp ? 'Create an account to report and follow local issues.' : 'Sign in to follow your city reports.'}
            </p>
            <form className="mt-6 space-y-4" onSubmit={submit}>
              {isSignUp && (
                <label className="block">
                  <span className="label">Full name</span>
                  <input
                    className="field"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    data-testid="input-signup-name"
                  />
                </label>
              )}
              <label className="block">
                <span className="label">Email</span>
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  data-testid={`input-${mode}-email`}
                />
              </label>
              <label className="block">
                <span className="label">Password</span>
                <input
                  className="field"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={isSignUp ? 8 : undefined}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  data-testid={`input-${mode}-password`}
                />
                {isSignUp && <span className="mt-1.5 block text-[10px] subtle">Use at least 8 characters.</span>}
              </label>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <button className="btn btn-primary w-full justify-center" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
                {!mutation.isPending && <ArrowRight size={15} />}
              </button>
            </form>
            <p className="mt-5 text-center text-xs subtle">
              {isSignUp ? 'Already have an account? ' : 'New to PurPravah? '}
              <Link
                className="font-bold text-primary"
                href={`${isSignUp ? '/sign-in' : '/sign-up'}${returnTo === '/' ? '' : `?returnTo=${encodeURIComponent(returnTo)}`}`}
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </div>
          <div className="mt-5 text-center text-xs">
            <Link href="/" className="font-bold text-primary">Return to PurPravah</Link>
          </div>
        </div>
        </section>
      </main>
    </div>
  );
}
