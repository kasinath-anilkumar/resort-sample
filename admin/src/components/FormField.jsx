import React from 'react';

const FormField = ({ label, type = 'text', value, onChange, placeholder = '', required = true }) => (
    <div>
        <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none transition focus:border-[#1b6b5f]"
            required={required}
        />
    </div>
);

export default FormField;
