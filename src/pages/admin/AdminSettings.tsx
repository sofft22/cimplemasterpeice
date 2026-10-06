import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BRAND, BANK } from '../../config';
import { NIGERIAN_STATES } from '../../lib/data';

interface ShippingZone {
  id: string;
  name: string;
  price: number;
  states: string[];
}

interface Settings {
  whatsapp_number: string;
  email: string;
  instagram: string;
  tiktok: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  payment_paystack_enabled: boolean;
  payment_transfer_enabled: boolean;
  payment_delivery_enabled: boolean;
  store_open: boolean;
  closed_message: string;
  lagos_axes: { id: string; label: string; price: number }[];
  shipping_zones: ShippingZone[];
}

const DEFAULT_SETTINGS: Settings = {
  whatsapp_number: BRAND.whatsappNumber,
  email: BRAND.email,
  instagram: BRAND.instagram,
  tiktok: BRAND.tiktok,
  bank_name: BANK.name,
  bank_account_name: BANK.accountName,
  bank_account_number: BANK.accountNumber,
  payment_paystack_enabled: true,
  payment_transfer_enabled: true,
  payment_delivery_enabled: true,
  store_open: true,
  closed_message: 'We’re closed for now. Back soon.',
  lagos_axes: [
    { id: 'axis-1', label: 'Axis 1: Lekki phase 1, Freedom Way, Itedo, Ikate, Ikoyi', price: 2000 },
    { id: 'axis-2', label: 'Axis 2: Lagos island, Victoria Island, Surulere, Mushin, Shomolu, Eti osa 1', price: 4000 },
    { id: 'axis-3', label: 'Axis 3: Agege, Ifako-ijaiye, Amuwo Odofin, Ikeja, Kosofe, Apapa, Lagos Mainland, Eti Osa 2', price: 8000 },
    { id: 'axis-4', label: 'Axis 4: Ojo, Epe, Ibeju, Ikorodu, Alimosho, Ajeromi, Eti Osa 3', price: 12000 },
  ],
  shipping_zones: [
    {
      id: 'zone-1',
      name: 'Near Lagos',
      price: 4000,
      states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Kogi'],
    },
    {
      id: 'zone-2',
      name: 'Mid Nigeria',
      price: 6500,
      states: [
        'Edo', 'Delta', 'Anambra', 'Enugu', 'Ebonyi', 'Imo', 'Abia',
        'Rivers', 'Bayelsa', 'Akwa Ibom', 'Cross River',
        'Benue', 'FCT', 'Nasarawa', 'Niger', 'Plateau',
      ],
    },
    {
      id: 'zone-3',
      name: 'Far Nigeria',
      price: 9500,
      states: [
        'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara',
        'Jigawa', 'Bauchi', 'Gombe', 'Yobe', 'Borno',
        'Adamawa', 'Taraba',
      ],
    },
  ],
};

/** States that aren't Lagos and aren't in any zone yet. */
function computeUnassigned(settings: Settings): string[] {
  const inAnyZone = new Set<string>();
  settings.shipping_zones.forEach((z) => {
    z.states.forEach((s) => inAnyZone.add(s));
  });
  return NIGERIAN_STATES.filter(
    (s) => s !== 'Lagos' && !inAnyZone.has(s)
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [statePicker, setStatePicker] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'settings')
        .maybeSingle();
      if (data?.value) {
        const merged = { ...DEFAULT_SETTINGS, ...(data.value as Partial<Settings>) };
        // Ensure shipping_zones exists even for old saved data
        if (!Array.isArray(merged.shipping_zones)) {
          merged.shipping_zones = DEFAULT_SETTINGS.shipping_zones;
        }
        setSettings(merged);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase
      .from('settings')
      .upsert(
        { key: 'settings', value: settings, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const updateAxis = (id: string, patch: Partial<{ label: string; price: number }>) =>
    setSettings((s) => ({
      ...s,
      lagos_axes: s.lagos_axes.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const addAxis = () => {
    setSettings((s) => ({
      ...s,
      lagos_axes: [...s.lagos_axes, { id: `axis-${Date.now()}`, label: '', price: 0 }],
    }));
  };

  const removeAxis = (id: string) => {
    setSettings((s) => ({ ...s, lagos_axes: s.lagos_axes.filter((a) => a.id !== id) }));
  };

  // ─── shipping zones ───────────────────────────────────────
  const updateZone = (id: string, patch: Partial<ShippingZone>) =>
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.map((z) =>
        z.id === id ? { ...z, ...patch } : z
      ),
    }));

  const addZone = () => {
    setSettings((s) => ({
      ...s,
      shipping_zones: [
        ...s.shipping_zones,
        {
          id: `zone-${Date.now()}`,
          name: `Zone ${s.shipping_zones.length + 1}`,
          price: 0,
          states: [],
        },
      ],
    }));
  };

  const removeZone = (id: string) => {
    const zone = settings.shipping_zones.find((z) => z.id === id);
    if (!zone) return;
    if (
      zone.states.length > 0 &&
      !confirm(
        `Remove "${zone.name}"? Its ${zone.states.length} state${
          zone.states.length === 1 ? '' : 's'
        } will become unassigned.`
      )
    ) {
      return;
    }
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.filter((z) => z.id !== id),
    }));
  };

  const addStateToZone = (zoneId: string, state: string) => {
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.map((z) => {
        if (z.id === zoneId) {
          return z.states.includes(state) ? z : { ...z, states: [...z.states, state] };
        }
        // Remove from other zones — a state lives in exactly one zone
        return { ...z, states: z.states.filter((st) => st !== state) };
      }),
    }));
  };

  const removeStateFromZone = (zoneId: string, state: string) => {
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.map((z) =>
        z.id === zoneId
          ? { ...z, states: z.states.filter((st) => st !== state) }
          : z
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center bg-white py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose/20 border-t-rose" />
      </div>
    );
  }

  const unassigned = computeUnassigned(settings);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        {/* HEADER */}
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-rose">
            Configuration
          </p>
          <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-black sm:text-[36px]">
            Settings
          </h1>
          <p className="mt-3 text-[14px] font-medium text-black/60">
            Contact, payments, delivery, store status.
          </p>
        </div>

        <div className="space-y-14">
          {/* STORE STATUS */}
          <section
            className={`rounded-2xl px-7 py-7 sm:px-8 sm:py-8 ${
              settings.store_open ? 'bg-green-50/60' : 'bg-rose/5'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/60">
                  Store status
                </p>
                <p
                  className={`mt-3 text-[22px] font-semibold tracking-tight sm:text-[26px] ${
                    settings.store_open ? 'text-green-800' : 'text-rose'
                  }`}
                >
                  {settings.store_open ? 'Open — accepting orders' : 'Closed — paused'}
                </p>
                <p className="mt-2 text-[13.5px] font-medium text-black/60">
                  {settings.store_open
                    ? 'Customers can browse and checkout.'
                    : 'Checkout is disabled.'}
                </p>
              </div>

              <button
                onClick={() => update('store_open', !settings.store_open)}
                className={`relative flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-400 ease-premium ${
                  settings.store_open ? 'bg-green-500' : 'bg-rose'
                }`}
                aria-label="Toggle store status"
              >
                <span
                  className={`absolute h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-400 ease-premium ${
                    settings.store_open ? 'translate-x-[24px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {!settings.store_open && (
              <div className="mt-7">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-black/60">
                  Closed message (shown on store)
                </label>
                <input
                  type="text"
                  value={settings.closed_message}
                  onChange={(e) => update('closed_message', e.target.value)}
                  placeholder="We're closed for now. Back soon."
                  className="w-full rounded-xl border border-[#f2e4e8] bg-white px-5 py-4 text-[14px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                />
              </div>
            )}
          </section>

          {/* CONTACT */}
          <section>
            <SectionTitle label="Contact" />
            <div className="overflow-hidden rounded-2xl border border-[#f2e4e8] bg-white">
              <SettingRow
                label="WhatsApp number"
                value={settings.whatsapp_number}
                onChange={(v) => update('whatsapp_number', v)}
                placeholder="2348012345678"
              />
              <SettingRow
                label="Email"
                value={settings.email}
                onChange={(v) => update('email', v)}
                placeholder="hello@cimmple.com"
              />
              <SettingRow
                label="Instagram"
                value={settings.instagram}
                onChange={(v) => update('instagram', v)}
                placeholder="https://instagram.com/handle"
              />
              <SettingRow
                label="TikTok"
                value={settings.tiktok}
                onChange={(v) => update('tiktok', v)}
                placeholder="https://tiktok.com/@handle"
                last
              />
            </div>
          </section>

          {/* BANK */}
          <section>
            <SectionTitle
              label="Bank details"
              sub="Shown to customers who choose Bank Transfer at checkout."
            />
            <div className="overflow-hidden rounded-2xl border border-[#f2e4e8] bg-white">
              <SettingRow
                label="Bank name"
                value={settings.bank_name}
                onChange={(v) => update('bank_name', v)}
                placeholder="Access Bank"
              />
              <SettingRow
                label="Account name"
                value={settings.bank_account_name}
                onChange={(v) => update('bank_account_name', v)}
                placeholder="Cimmple Beauty"
              />
              <SettingRow
                label="Account no."
                value={settings.bank_account_number}
                onChange={(v) => update('bank_account_number', v)}
                placeholder="0123456789"
                last
              />
            </div>
          </section>

          {/* PAYMENT METHODS */}
          <section>
            <SectionTitle
              label="Payment methods"
              sub="Turn off any method you don't want customers to see at checkout."
            />
            <div className="overflow-hidden rounded-2xl border border-[#f2e4e8] bg-white">
              <ToggleRow
                label="Pay with card"
                sub="Via Paystack"
                value={settings.payment_paystack_enabled}
                onChange={(v) => update('payment_paystack_enabled', v)}
              />
              <ToggleRow
                label="Bank transfer"
                sub="Customer sends to your account"
                value={settings.payment_transfer_enabled}
                onChange={(v) => update('payment_transfer_enabled', v)}
              />
              <ToggleRow
                label="Pay on delivery"
                sub="Cash or transfer at delivery"
                value={settings.payment_delivery_enabled}
                onChange={(v) => update('payment_delivery_enabled', v)}
                last
              />
            </div>
          </section>

          {/* LAGOS AXES */}
          <section>
            <SectionTitle
              label="Delivery zones — Lagos"
              sub="Pricing per axis. Shown to customers in Lagos at checkout."
            />
            <div className="overflow-hidden rounded-2xl border border-[#f2e4e8] bg-white">
              {settings.lagos_axes.map((axis, idx) => (
                <div
                  key={axis.id}
                  className={`grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-[1fr_140px_auto] sm:items-end sm:gap-6 ${
                    idx === settings.lagos_axes.length - 1
                      ? ''
                      : 'border-b border-[#f2e4e8]'
                  }`}
                >
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                      Zone
                    </label>
                    <input
                      className="w-full rounded-xl border border-[#f2e4e8] bg-white px-4 py-3 text-[14px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                      value={axis.label}
                      onChange={(e) => updateAxis(axis.id, { label: e.target.value })}
                      placeholder="e.g. Axis 5: Badagry, Ibeju, Epe"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                      Price (₦)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-[#f2e4e8] bg-white px-4 py-3 text-[14px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                      value={axis.price}
                      onChange={(e) =>
                        updateAxis(axis.id, { price: Number(e.target.value) })
                      }
                      placeholder="5000"
                    />
                  </div>

                  <button
                    onClick={() => removeAxis(axis.id)}
                    className="self-start text-[12px] font-bold uppercase tracking-[0.14em] text-red-600 transition-colors duration-400 ease-premium hover:text-red-800 sm:self-end sm:pb-3"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addAxis}
              className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-rose transition-colors duration-400 ease-premium hover:text-rose-deep"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3.5 w-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add zone
            </button>
          </section>

          {/* SHIPPING ZONES — NON-LAGOS */}
          <section>
            <SectionTitle
              label="Delivery zones — outside Lagos"
              sub="Group other states into flat-rate zones. Each state can only live in one zone."
            />

            <div className="space-y-4">
              {settings.shipping_zones.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-2xl border border-[#f2e4e8] bg-white p-6"
                >
                  {/* Zone header: name + price */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px] sm:items-end sm:gap-6">
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                        Zone name
                      </label>
                      <input
                        className="w-full rounded-xl border border-[#f2e4e8] bg-white px-4 py-3 text-[14px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                        value={zone.name}
                        onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                        placeholder="e.g. Near Lagos"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                        Price (₦)
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-[#f2e4e8] bg-white px-4 py-3 text-[14px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                        value={zone.price}
                        onChange={(e) =>
                          updateZone(zone.id, { price: Number(e.target.value) })
                        }
                        placeholder="4000"
                      />
                    </div>
                  </div>

                  {/* States in this zone */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                        States in this zone
                      </label>
                      <span className="text-[11px] font-bold text-black/40">
                        {zone.states.length}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {zone.states.map((s) => (
                        <button
                          key={s}
                          onClick={() => removeStateFromZone(zone.id, s)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#f2e4e8] bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:border-rose hover:text-rose"
                        >
                          {s}
                          <span className="text-[14px] leading-none text-black/30">×</span>
                        </button>
                      ))}

                      <button
                        onClick={() => setStatePicker(zone.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#f2e4e8] bg-white px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-rose transition-colors hover:border-rose hover:bg-rose/5"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add state
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeZone(zone.id)}
                    className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-red-600 transition-colors duration-400 ease-premium hover:text-red-800"
                  >
                    Remove zone
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addZone}
              className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-rose transition-colors duration-400 ease-premium hover:text-rose-deep"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3.5 w-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add another zone
            </button>

            {/* Unassigned states warning */}
            {unassigned.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-amber-800">
                  {unassigned.length} state{unassigned.length === 1 ? '' : 's'} not in any zone
                </p>
                <p className="mt-1.5 text-[12.5px] text-amber-900/80">
                  Customers in these states won't see a shipping price at checkout:{' '}
                  {unassigned.join(', ')}
                </p>
              </div>
            )}
          </section>

          {/* SAVE */}
          <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {savedAt && (
              <p className="text-center text-[12px] font-bold uppercase tracking-[0.16em] text-green-700 sm:text-right">
                ✓ Saved
              </p>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-rose py-4 text-[13px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_-10px_rgba(168,76,105,0.6)] transition-all duration-400 ease-premium hover:scale-[1.01] hover:bg-rose-deep disabled:opacity-60 sm:px-10"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* STATE PICKER MODAL */}
      {statePicker && (
        <StatePicker
          zones={settings.shipping_zones}
          currentZoneId={statePicker}
          onPick={(state) => {
            addStateToZone(statePicker, state);
            setStatePicker(null);
          }}
          onClose={() => setStatePicker(null)}
        />
      )}
    </div>
  );
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */

function StatePicker({
  zones,
  currentZoneId,
  onPick,
  onClose,
}: {
  zones: ShippingZone[];
  currentZoneId: string;
  onPick: (state: string) => void;
  onClose: () => void;
}) {
  // Which state is where — so we can show "currently in Mid Nigeria"
  const zoneByState: Record<string, string> = {};
  zones.forEach((z) => {
    z.states.forEach((s) => {
      zoneByState[s] = z.name;
    });
  });

  const available = NIGERIAN_STATES.filter((s) => {
    if (s === 'Lagos') return false; // Lagos has its own axes
    const currentZone = zones.find((z) => z.id === currentZoneId);
    if (currentZone?.states.includes(s)) return false; // already in this zone
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#f2e4e8] px-6 py-5">
          <h3 className="text-[14px] font-bold uppercase tracking-[0.14em] text-black">
            Add state to zone
          </h3>
          <button
            onClick={onClose}
            className="text-[18px] leading-none text-black/40 transition-colors hover:text-rose"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {available.map((s) => {
            const inZone = zoneByState[s];
            return (
              <button
                key={s}
                onClick={() => onPick(s)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-[14px] font-medium text-black transition-colors hover:bg-rose/5"
              >
                <span>{s}</span>
                {inZone && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/40">
                    Currently in {inZone}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.26em] text-rose">
        {label}
      </h2>
      {sub && <p className="mt-2 text-[13px] font-medium text-black/60">{sub}</p>}
    </div>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-6 ${
        last ? '' : 'border-b border-[#f2e4e8]'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
        {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        className="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 text-[14.5px] font-medium text-black placeholder:text-black/40 transition-colors duration-400 ease-premium focus:border-[#f2e4e8] focus:bg-white focus:px-4 focus:outline-none disabled:cursor-not-allowed sm:text-right"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  last,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-6 py-5 ${
        last ? '' : 'border-b border-[#f2e4e8]'
      }`}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-black">{label}</p>
        <p className="mt-1 text-[12.5px] font-medium text-black/60">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-400 ease-premium ${
          value ? 'bg-rose' : 'bg-[#f2e4e8]'
        }`}
        aria-label={label}
      >
        <span
          className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-400 ease-premium ${
            value ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}