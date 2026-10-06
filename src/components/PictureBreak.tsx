import salonImg from '../assets/salon.jpg';

export function PictureBreak() {
  return (
    <section id="our-hair" className="w-full scroll-mt-24 overflow-hidden bg-white">
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr]">
        {/* Image — bigger share */}
        <div className="relative h-[300px] w-full overflow-hidden bg-rose/5 sm:h-[360px] md:h-[420px]">
          <img
            src={salonImg}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ objectPosition: '50% 30%' }}
          />
        </div>

        {/* Text */}
        <div className="flex items-center bg-white px-6 py-10 sm:px-10 sm:py-12 md:h-[420px] md:px-14 md:py-0 lg:px-20">
          <div className="mx-auto w-full max-w-[560px] text-center md:mx-0 md:max-w-none md:text-left">
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-rose sm:text-[10px]">
              Cimmple Hair
            </p>
            <h3 className="mt-3 text-[15px] font-bold uppercase leading-[1.15] tracking-tight text-black sm:mt-4 sm:text-[20px] sm:leading-[1.1] lg:text-[24px]">
              WHAT MAKES HAIR TRULY GOOD?
            </h3>
            <p className="mx-auto mt-4 max-w-[32ch] text-[11.5px] font-medium italic leading-[1.65] text-black/60 sm:mt-5 sm:text-[13px] sm:leading-[1.7] md:mx-0 md:max-w-[44ch]">
              Hair quality goes beyond softness and shine. Virgin hair retains its natural cuticle alignment, which can contribute to smoother texture and reduced tangling when properly maintained. Density, construction, and fibre quality also influence how a wig wears and holds its shape over time.
              <br /><br />
              Quality starts with understanding what’s underneath the look.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}