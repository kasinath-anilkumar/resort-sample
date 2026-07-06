import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const AmenityCard = ({ amenity, onEdit, onDelete }) => (
    <article className="border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
            <div>
                <h3 className="text-lg font-semibold text-slate-950">{amenity.name}</h3>
                {amenity.icon && <p className="mt-1 text-xs font-bold uppercase text-[#1b6b5f]">{amenity.icon}</p>}
                <p className="mt-2 text-sm leading-6 text-slate-500">{amenity.description || 'No description yet.'}</p>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onEdit} className="text-slate-500 hover:text-[#1b6b5f]"><Edit size={16} /></button>
                <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
            </div>
        </div>
    </article>
);

export default AmenityCard;
