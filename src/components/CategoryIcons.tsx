interface IconProps { className?: string; }

export const CATEGORIES = [
  { id: 'hair', label: 'Hair' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'makeup', label: 'Makeup' },
  { id: 'body', label: 'Body' },
  { id: 'accessories', label: 'Accessories' },
];

export const CATEGORY_ICONS: Record<string, (p: IconProps) => any> = {
  hair: ({ className }) => (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M8 14c0-5 4-9 9-9s9 4 9 9v1.5c0 2.5-2 4.5-4.5 4.5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15v2.5c0 2.5 2 4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19" cy="15" r="1.6" fill="currentColor" />
      <path d="M20.5 16.5c3 1.5 4.5 4.5 4 8-.4 2.5-2.5 4-5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  skincare: ({ className }) => (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="13" y="4" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 8.5h10c.8 0 1.5.7 1.5 1.5v14c0 1.4-1.1 2.5-2.5 2.5h-8c-1.4 0-2.5-1.1-2.5-2.5V10c0-.8.7-1.5 1.5-1.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 13.5c-1.4 1.8-2.8 3.2-2.8 5a2.8 2.8 0 1 0 5.6 0c0-1.8-1.4-3.2-2.8-5Z" fill="currentColor" />
    </svg>
  ),
  makeup: ({ className }) => (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M10 12h12v14c0 1.1-.9 2-2 2h-8c-1.1 0-2-.9-2-2V12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 12V8c0-1.7 1.3-3 3-3s3 1.3 3 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  body: ({ className }) => (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  accessories: ({ className }) => (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="6" y="10" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};