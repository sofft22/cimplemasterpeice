import { BRAND } from '../config';

interface Props {
  /** Font size, e.g. "text-[15px]" or "text-[22px]" */
  className?: string;
  /** If true, suffix uses rose instead of grey */
  roseSuffix?: boolean;
}

export function BrandLogo({ className = '', roseSuffix = false }: Props) {
  return (
    <span className={`flex items-baseline whitespace-nowrap ${className}`}>
      <span className="font-bold text-black">{BRAND.name}</span>
      <span
        className={`font-light ${
          roseSuffix ? 'text-rose' : 'text-black/60'
        }`}
      >
        {'\u00A0'}
        {BRAND.suffix}
      </span>
      <span className="font-bold text-rose">.</span>
    </span>
  );
}