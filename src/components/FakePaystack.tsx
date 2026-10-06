import { useState } from 'react';
import { formatPrice } from '../config';

interface Props {
  amount: number;
  email: string;
  onCancel: () => void;
  onSuccess: () => void;
}

type Step = 'card' | 'pin' | 'otp' | 'processing' | 'success';

export function FakePaystack({ amount, email, onCancel, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('card');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExpiry = (v: string) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/, '$1/');

  const submitCard = () => {
    if (card.replace(/\s/g, '').length < 16) return setError('Enter a valid card number');
    if (expiry.length < 5) return setError('Enter card expiry');
    if (cvv.length < 3) return setError('Enter CVV');
    setError('');
    setStep('pin');
  };

  const submitPin = () => {
    if (pin.length < 4) return setError('Enter your 4-digit PIN');
    setError('');
    setStep('otp');
  };

  const submitOtp = () => {
    if (otp.length < 4) return setError('Enter the OTP sent to your phone');
    setError('');
    setStep('processing');
    setTimeout(() => setStep('success'), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center"
      onClick={step === 'processing' ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] overflow-hidden rounded-t-2xl bg-white font-sans sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-pink-line px-7 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#011b33] text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 3v18M3 12h18" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-black">Paystack</span>
          </div>
          <button
            onClick={onCancel}
            disabled={step === 'processing'}
            className="text-[16px] leading-none text-muted transition-colors duration-400 ease-premium hover:text-black disabled:opacity-30"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="bg-[#fff9e5] px-7 py-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a6d00]">
          Test Mode · No real charge
        </div>

        <div className="border-b border-pink-line px-7 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Paying</p>
          <p className="mt-2 text-[28px] font-medium text-black">{formatPrice(amount)}</p>
          <p className="mt-2 text-[12px] text-muted">{email || 'guest@cimmple.com'}</p>
        </div>

        <div className="px-7 py-8">
          {step === 'card' && (
            <>
              <p className="text-[13px] text-muted">Enter your card details to pay securely.</p>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                    Card number
                  </label>
                  <input
                    value={card}
                    onChange={(e) => setCard(formatCard(e.target.value))}
                    placeholder="4084 0840 8408 4081"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-pink-line bg-white px-5 py-3.5 text-[14px] text-black placeholder:text-muted/60 focus:border-rose focus:outline-none"
                  />
                  <div className="mt-3 flex gap-1.5">
                    {['Visa', 'Mastercard', 'Verve'].map((b) => (
                      <span
                        key={b}
                        className="rounded border border-pink-line bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-muted"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                      Expiry
                    </label>
                    <input
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-lg border border-pink-line bg-white px-5 py-3.5 text-[14px] text-black placeholder:text-muted/60 focus:border-rose focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                      CVV
                    </label>
                    <input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="408"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-lg border border-pink-line bg-white px-5 py-3.5 text-[14px] text-black placeholder:text-muted/60 focus:border-rose focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 text-[12px] text-red-600">{error}</p>}

              <button
                onClick={submitCard}
                className="mt-7 w-full rounded-full bg-[#011b33] py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium hover:bg-black"
              >
                Continue
              </button>
            </>
          )}

          {step === 'pin' && (
            <>
              <p className="text-[13px] text-muted">
                Enter your 4-digit card PIN to authorize this transaction.
              </p>
              <div className="mt-7">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  inputMode="numeric"
                  type="password"
                  maxLength={4}
                  className="w-full rounded-lg border border-pink-line bg-white px-5 py-5 text-center text-[22px] tracking-[0.7em] text-black focus:border-rose focus:outline-none"
                />
              </div>

              {error && <p className="mt-4 text-[12px] text-red-600">{error}</p>}

              <button
                onClick={submitPin}
                className="mt-7 w-full rounded-full bg-[#011b33] py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium hover:bg-black"
              >
                Authorize
              </button>
              <button
                onClick={() => { setStep('card'); setError(''); }}
                className="mt-3 w-full py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted transition-colors duration-400 ease-premium hover:text-black"
              >
                ← Back
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-[13px] text-muted">
                We sent a 6-digit code to the phone number on file. Enter it below.
              </p>
              <div className="mt-7">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-lg border border-pink-line bg-white px-5 py-5 text-center text-[22px] tracking-[0.5em] text-black focus:border-rose focus:outline-none"
                />
              </div>
              <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                Resend code in 0:28
              </p>

              {error && <p className="mt-4 text-[12px] text-red-600">{error}</p>}

              <button
                onClick={submitOtp}
                className="mt-7 w-full rounded-full bg-[#011b33] py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium hover:bg-black"
              >
                Pay {formatPrice(amount)}
              </button>
              <button
                onClick={() => { setStep('pin'); setError(''); }}
                className="mt-3 w-full py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted transition-colors duration-400 ease-premium hover:text-black"
              >
                ← Back
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-pink-line border-t-rose" />
              <p className="mt-7 text-[13px] font-medium text-black">Processing payment…</p>
              <p className="mt-2 text-[11px] text-muted">Please don't close this window</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-7 text-[16px] font-medium text-black">Payment successful</p>
              <p className="mt-2 text-[12px] text-muted">{formatPrice(amount)} has been charged</p>
              <button
                onClick={onSuccess}
                className="mt-8 w-full rounded-full bg-[#011b33] py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium hover:bg-black"
              >
                Continue
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-pink-line bg-white px-7 py-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            🔒 Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}