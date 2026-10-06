import { useEffect, useState } from 'react';
import {
  fetchAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
  type CouponInput,
} from '../../lib/store';

type FormState = {
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: string;
  first_order_only: boolean;
  min_order: string;
  usage_limit: string;
  expires_at: string;
  active: boolean;
  featured: boolean;
  banner_text: string;
};

const EMPTY: FormState = {
  code: '',
  type: 'percent',
  value: '10',
  first_order_only: false,
  min_order: '0',
  usage_limit: '',
  expires_at: '',
  active: true,
  featured: false,
  banner_text: '',
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const list = await fetchAllCoupons();
    setCoupons(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (c: Coupon) => {
    setForm({
      code: c.code.toUpperCase(),
      type: c.type,
      value: String(c.value),
      first_order_only: c.first_order_only,
      min_order: String(c.min_order),
      usage_limit: c.usage_limit === null ? '' : String(c.usage_limit),
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      active: c.active,
      featured: c.featured,
      banner_text: c.banner_text ?? '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.code.trim()) {
      setError('Code is required');
      return;
    }
    if (form.type !== 'shipping' && !form.value) {
      setError('Value is required');
      return;
    }

    setSaving(true);

    const payload: CouponInput = {
      code: form.code.trim().toLowerCase(),
      type: form.type,
      value: form.type === 'shipping' ? 0 : Number(form.value) || 0,
      first_order_only: form.first_order_only,
      min_order: Number(form.min_order) || 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      active: form.active,
      featured: form.featured,
      banner_text: form.banner_text.trim() || null,
    };

    if (editingId) {
      const { error: err } = await updateCoupon(editingId, payload);
      setSaving(false);
      if (err) {
        setError(err);
        return;
      }
    } else {
      const { error: err } = await createCoupon(payload);
      setSaving(false);
      if (err) {
        setError(err);
        return;
      }
    }

    resetForm();
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    await deleteCoupon(id);
    await load();
  };

  const handleToggle = async (c: Coupon, field: 'active' | 'featured') => {
    await updateCoupon(c.id, { [field]: !c[field] });
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-black sm:text-[28px]">
            Coupons
          </h1>
          <p className="mt-1 text-[13px] text-black/55">
            Create discount codes
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm(EMPTY);
              setEditingId(null);
              setShowForm(true);
            }}
            className="rounded-full bg-rose px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-rose-deep"
          >
            + New
          </button>
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-[#eaeaea] bg-white p-6">
          <h2 className="mb-5 text-[15px] font-semibold text-black">
            {editingId ? 'Edit coupon' : 'New coupon'}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code">
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="WELCOME10"
                className="input"
              />
            </Field>

            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as any })
                }
                className="input"
              >
                <option value="percent">Percent off (%)</option>
                <option value="fixed">Fixed amount off (₦)</option>
                <option value="shipping">Free shipping</option>
              </select>
            </Field>

            {form.type !== 'shipping' && (
              <Field
                label={`Value ${form.type === 'percent' ? '(%)' : '(₦)'}`}
              >
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="input"
                />
              </Field>
            )}

            <Field label="Minimum order (₦)">
              <input
                type="number"
                value={form.min_order}
                onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                className="input"
              />
            </Field>

            <Field label="Max uses (empty = unlimited)">
              <input
                type="number"
                value={form.usage_limit}
                onChange={(e) =>
                  setForm({ ...form, usage_limit: e.target.value })
                }
                className="input"
              />
            </Field>

            <Field label="Expires (optional)">
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm({ ...form, expires_at: e.target.value })
                }
                className="input"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Banner text (optional)">
              <input
                type="text"
                value={form.banner_text}
                onChange={(e) =>
                  setForm({ ...form, banner_text: e.target.value })
                }
                placeholder="e.g. Eid sale — 15% off everything"
                className="input"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-5">
            <Toggle
              label="First order only"
              checked={form.first_order_only}
              onChange={(v) => setForm({ ...form, first_order_only: v })}
            />
            <Toggle
              label="Active"
              checked={form.active}
              onChange={(v) => setForm({ ...form, active: v })}
            />
            <Toggle
              label="Featured (home banner)"
              checked={form.featured}
              onChange={(v) => setForm({ ...form, featured: v })}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-[12.5px] font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-rose px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-rose-deep disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-full border border-[#eaeaea] px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-black transition-colors hover:border-black"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-[2.5px] border-rose/20 border-t-rose" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-[#eaeaea] bg-white py-16 text-center">
          <p className="text-[13.5px] font-medium text-black">No coupons yet</p>
          <p className="mt-1.5 text-[12.5px] text-black/50">
            Create one to start running promos
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[#eaeaea] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-black">
                      {c.code.toUpperCase()}
                    </p>
                    {c.featured && (
                      <span className="rounded-md bg-rose/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rose">
                        Featured
                      </span>
                    )}
                    {!c.active && (
                      <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-black/50">
                        Inactive
                      </span>
                    )}
                  </div>

                  {c.banner_text && (
                    <p className="mt-1.5 text-[12.5px] italic text-black/60">
                      "{c.banner_text}"
                    </p>
                  )}

                  <p className="mt-1.5 text-[12.5px] text-black/60">
                    {c.type === 'percent'
                      ? `${c.value}% off`
                      : c.type === 'fixed'
                      ? `₦${c.value.toLocaleString('en-NG')} off`
                      : 'Free shipping'}
                    {c.min_order > 0 &&
                      ` · min ₦${c.min_order.toLocaleString('en-NG')}`}
                    {c.first_order_only && ` · first order only`}
                    {c.usage_limit !== null &&
                      ` · ${c.uses}/${c.usage_limit} used`}
                    {c.usage_limit === null &&
                      c.uses > 0 &&
                      ` · ${c.uses} used`}
                    {c.expires_at &&
                      ` · expires ${new Date(c.expires_at).toLocaleDateString(
                        'en-NG'
                      )}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleToggle(c, 'active')}
                    className="rounded-full border border-[#eaeaea] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-black transition-colors hover:border-black"
                  >
                    {c.active ? 'Off' : 'On'}
                  </button>
                  <button
                    onClick={() => handleToggle(c, 'featured')}
                    className="rounded-full border border-[#eaeaea] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-black transition-colors hover:border-black"
                  >
                    {c.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-full border border-[#eaeaea] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-black transition-colors hover:border-black"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-full border border-[#eaeaea] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-red-600 transition-colors hover:border-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-black/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <span
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-rose' : 'bg-black/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-[13px] font-medium text-black">{label}</span>
    </label>
  );
}