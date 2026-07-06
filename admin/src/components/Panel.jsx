import React from 'react';

const Panel = ({ title, subtitle, children, className = '' }) => (
    <section className={`border border-slate-200 bg-white p-3 sm:p-5 shadow-sm ${className}`}>
        <div className="mb-3 sm:mb-5">
            <h2 className="text-lg sm:text-2xl font-semibold text-slate-950">{title}</h2>
            {subtitle && <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">{subtitle}</p>}
        </div>
        {children}
    </section>
);

export default Panel;
