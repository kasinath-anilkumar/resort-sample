
const FormField = ({
  id,
  label,
  type = 'text',
  icon: Icon,
  placeholder = '',
  value,
  onChange,
  required = true,
  as = 'input',
  rows = 5,
  helper,
}) => {
  const sharedClasses = 'w-full rounded-3xl border border-slate-700/80 bg-slate-950/90 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-beige/25 focus:border-beige';
  const inputClasses = `${sharedClasses} ${Icon ? 'pl-12' : 'pl-5'} pr-5 py-4`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.28em] text-slate-400">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon size={18} />
          </span>
        )}
        {as === 'textarea' ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={`${inputClasses} min-h-[12rem] resize-none`}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
          />
        )}
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
};

export default FormField;
