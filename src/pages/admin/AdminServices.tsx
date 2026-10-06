import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../config';

interface ServiceRow {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  created_at?: string;
}

export function AdminServices() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    setServices((data ?? []) as ServiceRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    services.length > 0 && services.every((s) => selected.has(s.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) services.forEach((s) => next.delete(s.id));
      else services.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} service${selected.size > 1 ? 's' : ''}?`)) return;
    setBusy(true);
    await supabase.from('services').delete().in('id', Array.from(selected));
    setBusy(false);
    setSelected(new Set());
    await load();
  };

  const handleSingleDelete = async (s: ServiceRow) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    await supabase.from('services').delete().eq('id', s.id);
    await load();
  };

  const handleToggleStock = async (s: ServiceRow) => {
    await supabase.from('services').update({ in_stock: !s.in_stock }).eq('id', s.id);
    await load();
  };

  if (creating || editing) {
    return (
      <ServiceForm
        service={editing}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        {/* ============ HEADER ============ */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-rose">
              In-studio
            </p>
            <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-black sm:text-[36px]">
              Services
            </h1>
            <p className="mt-3 text-[14px] font-medium text-black/60">
              {services.length} total
              {services.filter((s) => !s.in_stock).length > 0 && (
                <>
                  {' · '}
                  <span className="text-rose font-bold">
                    {services.filter((s) => !s.in_stock).length} hidden
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 self-start rounded-full bg-rose px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_25px_-10px_rgba(168,76,105,0.6)] transition-all duration-400 ease-premium hover:scale-[1.02] hover:bg-rose-deep sm:self-auto"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add service
          </button>
        </div>

        {/* ============ CONTENT ============ */}
        {loading ? (
          <div className="flex justify-center py-28">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose/20 border-t-rose" />
          </div>
        ) : services.length === 0 ? (
          <div className="py-28 text-center">
            <p className="text-[14px] font-medium text-black/60">
              No services yet. Add your first one.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f2e4e8]">
                    <th className="w-12 py-5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 cursor-pointer accent-rose"
                      />
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                      Service
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                      Duration
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                      Price
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                      Status
                    </th>
                    <th className="w-44 px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => {
                    const isSelected = selected.has(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-[#f2e4e8] transition-colors duration-400 ease-premium hover:bg-rose/[0.03] ${
                          isSelected ? 'bg-rose/[0.04]' : ''
                        }`}
                      >
                        <td className="py-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(s.id)}
                            className="h-4 w-4 cursor-pointer accent-rose"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#fbeef1]">
                              {s.image_url && (
                                <img
                                  src={s.image_url}
                                  alt={s.name}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-medium text-black">
                                {s.name}
                              </p>
                              {s.description && (
                                <p className="mt-1 truncate text-[12px] font-medium text-black/55">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[13px] font-medium text-black/70">
                          {s.duration || '—'}
                        </td>
                        <td className="px-6 py-5 font-numbers text-[16px] text-black">
                          {formatPrice(s.price ?? 0)}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 text-[12px] font-bold ${
                              s.in_stock ? 'text-green-700' : 'text-rose'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                s.in_stock ? 'bg-green-500' : 'bg-rose'
                              }`}
                            />
                            {s.in_stock ? 'Offered' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => setEditing(s)}
                            className="mr-5 text-[12px] font-bold uppercase tracking-[0.14em] text-rose transition-colors duration-400 ease-premium hover:text-rose-deep"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSingleDelete(s)}
                            className="text-[12px] font-bold uppercase tracking-[0.14em] text-red-600 transition-colors duration-400 ease-premium hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list with header */}
            <div className="lg:hidden">
              <div className="flex items-center gap-3 border-b border-[#f2e4e8] py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-rose"
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                  Service
                </span>
                <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                  Price
                </span>
              </div>

              {services.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 border-b border-[#f2e4e8] py-5 last:border-0 ${
                      isSelected ? 'bg-rose/[0.04]' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 flex-shrink-0 cursor-pointer accent-rose"
                    />
                    <button
                      onClick={() => setEditing(s)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#fbeef1]">
                        {s.image_url && (
                          <img
                            src={s.image_url}
                            alt={s.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span
                          className={`absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                            s.in_stock ? 'bg-green-500' : 'bg-rose'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-black">
                          {s.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-medium text-black/55">
                          {s.duration || 'No duration'}
                        </p>
                      </div>
                      <p className="font-numbers whitespace-nowrap text-[16px] text-black">
                        {formatPrice(s.price ?? 0)}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating bulk bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-24 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-rose/30 bg-white px-6 py-4 shadow-[0_20px_50px_-15px_rgba(168,76,105,0.4)] lg:bottom-8">
          <p className="text-[13px] font-bold text-rose">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelected(new Set())}
              className="text-[12px] font-bold uppercase tracking-[0.14em] text-black/70 hover:text-black"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={busy}
              className="rounded-full bg-rose px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-400 ease-premium hover:bg-rose-deep disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   SERVICE FORM
   ============================================ */

interface FormProps {
  service: ServiceRow | null;
  onSaved: () => void;
  onCancel: () => void;
}

function ServiceForm({ service, onSaved, onCancel }: FormProps) {
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [duration, setDuration] = useState(service?.duration ?? '');
  const [price, setPrice] = useState(String(service?.price ?? ''));
  const [imageUrl, setImageUrl] = useState(service?.image_url ?? '');
  const [inStock, setInStock] = useState(service?.in_stock ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `service-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (!price || Number(price) <= 0) return setError('Valid price is required');
    if (!imageUrl) return setError('Image is required');

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      duration: duration.trim(),
      price: Number(price),
      image_url: imageUrl,
      in_stock: inStock,
    };

    const result = service
      ? await supabase.from('services').update(payload).eq('id', service.id)
      : await supabase.from('services').insert(payload);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!confirm(`Delete "${service.name}"?`)) return;
    await supabase.from('services').delete().eq('id', service.id);
    onSaved();
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={onCancel}
            className="mb-6 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-black/60 transition-colors duration-400 ease-premium hover:text-rose"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to services
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-rose">
            {service ? 'Edit' : 'New'}
          </p>
          <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-black sm:text-[36px]">
            {service ? 'Edit service' : 'New service'}
          </h1>
        </div>

        <div className="space-y-12">
          {/* BASICS */}
          <section>
            <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.26em] text-rose">
              Basics
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#f2e4e8] bg-white">
              <FormRow
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Hair Styling"
              />
              <FormRowTextarea
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Short, evocative description."
              />
              <FormRow
                label="Duration"
                value={duration}
                onChange={setDuration}
                placeholder="90 min"
              />
              <FormRow
                label="Price (₦)"
                value={price}
                onChange={setPrice}
                placeholder="15000"
                type="number"
                last
              />
            </div>
          </section>

          {/* IMAGE */}
          <section>
            <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.26em] text-rose">
              Image
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {imageUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#f2e4e8] bg-[#fbeef1]">
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[14px] font-bold text-black shadow-sm hover:text-rose"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#f2e4e8] bg-white text-[11px] font-bold uppercase tracking-[0.14em] text-black/60 transition-colors duration-400 ease-premium hover:border-rose hover:text-rose">
                  {uploading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-[2px] border-rose/20 border-t-rose" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Upload
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-4 text-[12.5px] font-medium text-black/55">
              JPG or PNG up to 5MB. Square works best.
            </p>
          </section>

          {/* AVAILABILITY */}
          <section>
            <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.26em] text-rose">
              Availability
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#f2e4e8] bg-white">
              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-black">
                    Currently offered
                  </p>
                  <p className="mt-1 text-[12.5px] font-medium text-black/60">
                    {inStock
                      ? 'Visible on the storefront'
                      : 'Hidden from the storefront'}
                  </p>
                </div>
                <button
                  onClick={() => setInStock((v) => !v)}
                  className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-400 ease-premium ${
                    inStock ? 'bg-rose' : 'bg-[#f2e4e8]'
                  }`}
                  aria-label="Toggle availability"
                >
                  <span
                    className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-400 ease-premium ${
                      inStock ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {error && (
            <p className="rounded-2xl bg-red-50 px-6 py-4 text-[13.5px] font-medium text-red-700">
              {error}
            </p>
          )}

          {/* SAVE */}
          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {service && (
              <button
                onClick={handleDelete}
                className="order-2 text-[12px] font-bold uppercase tracking-[0.16em] text-red-600 transition-colors duration-400 ease-premium hover:text-red-800 sm:order-1 sm:mr-auto"
              >
                Delete service
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="order-1 rounded-full bg-rose py-4 text-[13px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_-10px_rgba(168,76,105,0.6)] transition-all duration-400 ease-premium hover:scale-[1.01] hover:bg-rose-deep disabled:opacity-60 sm:order-2 sm:px-10"
            >
              {saving ? 'Saving…' : service ? 'Save changes' : 'Create service'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   ROW COMPONENTS
   ============================================ */

function FormRow({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6 ${
        last ? '' : 'border-b border-[#f2e4e8]'
      }`}
    >
      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 text-[14.5px] font-medium text-black placeholder:text-black/40 transition-colors duration-400 ease-premium focus:border-[#f2e4e8] focus:bg-white focus:px-4 focus:outline-none sm:text-right"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FormRowTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[#f2e4e8] px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6">
      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/60 sm:pt-2">
        {label}
      </label>
      <textarea
        rows={3}
        className="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 text-[14.5px] font-medium text-black placeholder:text-black/40 transition-colors duration-400 ease-premium focus:border-[#f2e4e8] focus:bg-white focus:px-4 focus:outline-none sm:text-right"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}