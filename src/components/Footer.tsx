import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { useSettings } from '../context/SettingsContext';
import { ContentModal } from './ContentModal';

type ModalKey = 'about' | 'shipping' | 'returns' | 'privacy' | 'terms' | 'contact' | null;

export function Footer() {
  const { settings } = useSettings();
  const [modal, setModal] = useState<ModalKey>(null);

  useEffect(() => {
    const onAbout = () => setModal('about');
    const onContact = () => setModal('contact');
    window.addEventListener('open-modal:about', onAbout);
    window.addEventListener('open-modal:contact', onContact);
    return () => {
      window.removeEventListener('open-modal:about', onAbout);
      window.removeEventListener('open-modal:contact', onContact);
    };
  }, []);

  return (
    <>
      <footer className="bg-black text-white" role="contentinfo">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 sm:pt-20">
          <div className="mb-14 text-center">
            <p className="text-[24px] font-bold uppercase leading-none tracking-[0.04em] text-white sm:text-[28px]">
              {BRAND.name}
              <span className="text-rose">.</span>
            </p>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.26em] text-white/50">
              {BRAND.established} · {BRAND.city}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 border-t border-white/10 pt-12 sm:grid-cols-4 sm:gap-8">
            <nav aria-label="Shop">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/50">Shop</p>
              <ul className="mt-6 space-y-3.5 text-[13px] font-medium">
                <li><Link to="/shop?category=wigs" className="text-white/80 transition-colors hover:text-rose">Wigs</Link></li>
                <li><Link to="/shop?category=extensions" className="text-white/80 transition-colors hover:text-rose">Extensions</Link></li>
                <li><Link to="/shop?category=care" className="text-white/80 transition-colors hover:text-rose">Hair Care</Link></li>
                <li><Link to="/shop" className="text-white/80 transition-colors hover:text-rose">Shop All</Link></li>
              </ul>
            </nav>

            <nav aria-label="Company">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/50">Company</p>
              <ul className="mt-6 space-y-3.5 text-[13px] font-medium">
                <li><button onClick={() => setModal('about')} className="text-white/80 transition-colors hover:text-rose">About</button></li>
                <li><button onClick={() => setModal('contact')} className="text-white/80 transition-colors hover:text-rose">Contact</button></li>
              </ul>
            </nav>

            <nav aria-label="Help">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/50">Help</p>
              <ul className="mt-6 space-y-3.5 text-[13px] font-medium">
                <li><button onClick={() => setModal('shipping')} className="text-white/80 transition-colors hover:text-rose">Shipping</button></li>
                <li><button onClick={() => setModal('returns')} className="text-white/80 transition-colors hover:text-rose">Returns & Refunds</button></li>
                <li><button onClick={() => setModal('privacy')} className="text-white/80 transition-colors hover:text-rose">Privacy Policy</button></li>
                <li><button onClick={() => setModal('terms')} className="text-white/80 transition-colors hover:text-rose">Terms of Service</button></li>
              </ul>
            </nav>

            <nav aria-label="Connect">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/50">Connect</p>
              <ul className="mt-6 space-y-3.5 text-[13px] font-medium">
                <li><a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className="text-white/80 transition-colors hover:text-rose">WhatsApp</a></li>
                <li><a href={settings.instagram} target="_blank" rel="noreferrer" className="text-white/80 transition-colors hover:text-rose">Instagram</a></li>
                <li><a href={settings.tiktok} target="_blank" rel="noreferrer" className="text-white/80 transition-colors hover:text-rose">TikTok</a></li>
                <li><a href={`mailto:${settings.email}`} className="text-white/80 transition-colors hover:text-rose">Email</a></li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-6 py-7 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
            © {new Date().getFullYear()} {BRAND.name} · All rights reserved
          </p>
        </div>
      </footer>

      <ContentModal open={modal === 'about'} onClose={() => setModal(null)} title="About">
        <div className="space-y-5 text-[14.5px] leading-[1.7] text-black/80">
          <p className="text-[16px] font-semibold text-black">
            {BRAND.name} is a hair studio and store based in {BRAND.city}.
          </p>
          <p>We started because buying hair in Nigeria shouldn't feel like a gamble — you shouldn't have to worry about quality, shedding, or whether the bundle will last a week.</p>
          <p>Every wig, bundle, and extension we sell is hand-checked before it reaches you. We work with trusted suppliers, and we personally inspect each piece for density, softness, and finish.</p>
          <p>Whether you're shopping online, booking a styling session, or just asking a question on WhatsApp — we treat you like family.</p>
          <p className="pt-2 text-[13px] font-bold uppercase tracking-[0.18em] text-rose">— The {BRAND.name} Team</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'shipping'} onClose={() => setModal(null)} title="Shipping Policy">
        <div className="space-y-5 text-[14.5px] leading-[1.7] text-black/80">
          <h3 className="text-[15px] font-bold uppercase tracking-[0.14em] text-black">Delivery in Lagos</h3>
          <p>Orders within Lagos are delivered in 1–2 working days. Shipping cost is calculated based on your delivery axis at checkout.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Outside Lagos</h3>
          <p>We deliver nationwide. Other states are typically 2–4 working days via our courier partners.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Free Delivery</h3>
          <p>Free nationwide delivery on orders over ₦100,000.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'returns'} onClose={() => setModal(null)} title="Returns & Refunds">
        <div className="space-y-5 text-[14.5px] leading-[1.7] text-black/80">
          <h3 className="text-[15px] font-bold uppercase tracking-[0.14em] text-black">Our policy</h3>
          <p>Because of hygiene and safety, we cannot accept returns on hair products once they have been opened, worn, or tampered with.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Damaged or wrong item</h3>
          <p>If your order arrives damaged or is not what you ordered, message us on WhatsApp within 24 hours of delivery with photos.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Refunds</h3>
          <p>Approved refunds are processed within 3–5 working days back to your original payment method.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'privacy'} onClose={() => setModal(null)} title="Privacy Policy">
        <div className="space-y-5 text-[14.5px] leading-[1.7] text-black/80">
          <p>We respect your privacy. Here's what we collect and why:</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">What we collect</h3>
          <p>When you place an order, we collect your name, phone number, email, and delivery address. This is used only to fulfil your order.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">What we don't do</h3>
          <p>We never sell your data. We never share it with third parties except the courier handling your delivery.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Payment</h3>
          <p>Payments are processed securely via Paystack. We never store your card details.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'terms'} onClose={() => setModal(null)} title="Terms of Service">
        <div className="space-y-5 text-[14.5px] leading-[1.7] text-black/80">
          <p>By shopping with {BRAND.name}, you agree to the following:</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Orders</h3>
          <p>All orders are subject to availability. We reserve the right to cancel an order if the item is out of stock — you will be refunded in full.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Pricing</h3>
          <p>Prices are as displayed at checkout. We may update pricing at any time without notice.</p>
          <h3 className="pt-3 text-[15px] font-bold uppercase tracking-[0.14em] text-black">Product images</h3>
          <p>We do our best to show colours and textures accurately. Slight variations may occur due to lighting or device screens.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'contact'} onClose={() => setModal(null)} title="Contact">
        <div className="space-y-6 text-[14.5px] leading-[1.7] text-black/80">
          <p className="text-[15px]">We're available <strong>Mon–Sat, 10am–6pm</strong>.</p>
          <div className="space-y-4 pt-2">
            <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-black transition-colors hover:text-rose">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#075E54] text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
                </svg>
              </span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-black/50">WhatsApp</p>
                <p className="font-medium text-black">{settings.whatsapp_number}</p>
              </div>
            </a>
            <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-black transition-colors hover:text-rose">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-black/50">Email</p>
                <p className="font-medium text-black">{settings.email}</p>
              </div>
            </a>
          </div>
        </div>
      </ContentModal>
    </>
  );
}