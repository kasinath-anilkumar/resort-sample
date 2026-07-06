import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const CategoryCard = ({ type, onEdit, onDelete }) => (
    <article className="border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
            <div>
                <h3 className="text-xl font-semibold text-slate-950">{type.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{type.description || 'No description yet.'}</p>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onEdit} className="text-slate-500 hover:text-[#1b6b5f]"><Edit size={16} /></button>
                <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
            </div>
        </div>
    </article>
);

export default CategoryCard;
