import { CATEGORIES_WITH_ALL } from '../config/categories';

interface Props {
  active: string;
  onChange: (c: string) => void;
}

export function CategoryChips({ active, onChange }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {CATEGORIES_WITH_ALL.map((c) => {
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-400 ease-premium ${
              isActive
                ? 'border-rose bg-rose text-white'
                : 'border-[#f2e4e8] bg-white text-black hover:border-rose hover:text-rose'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}