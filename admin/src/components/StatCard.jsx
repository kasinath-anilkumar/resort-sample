import React from 'react';

const StatCard = ({ icon, label, value }) => (
    <div className="border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
        <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-[#e4fff6] text-[#1b6b5f]">
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-slate-950">{value}</p>
    </div>
);

export default StatCard;
