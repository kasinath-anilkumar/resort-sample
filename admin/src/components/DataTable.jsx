import React from 'react';

const DataTable = ({ headers, rows }) => (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-3 sm:px-0">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead>
                    <tr className="border-b border-slate-200 text-[10px] sm:text-xs font-bold uppercase text-slate-500">
                        {headers.map((header) => (
                            <th key={header} className="pb-2 sm:pb-3 pr-2 sm:pr-4">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-b border-slate-100">
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="py-2.5 sm:py-4 pr-2 sm:pr-4 text-slate-700">{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default DataTable;
