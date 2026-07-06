import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const RoomInventoryCard = ({ room, onEdit, onDelete }) => (
    <article className="flex flex-col gap-4 border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
        <img src={room.images?.[0]} alt={room.name} className="h-48 w-full bg-slate-100 object-cover rounded" />
        <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-950 text-lg">{room.name}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${room.availability === false ? 'bg-red-50 text-red-600' : 'bg-[#e4fff6] text-[#1b6b5f]'}`}>
                    {room.availability === false ? 'Hidden' : 'Live'}
                </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{room.type} <span className="mx-1 text-slate-300">•</span> <span className="font-semibold">${room.pricePerNight}</span> / night</p>
            <p className="mt-1 text-xs text-slate-500">{room.totalRooms || 1} units <span className="mx-1 text-slate-300">•</span> Base {room.maxGuests} guests included</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {(room.amenities || []).slice(0, 4).map((amenity) => (
                    <span key={amenity} className="rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">{amenity}</span>
                ))}
                {(room.amenities || []).length > 4 && (
                    <span className="rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                        +{(room.amenities || []).length - 4} more
                    </span>
                )}
            </div>
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-100 mt-2">
            <button type="button" onClick={onEdit} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#1b6b5f] bg-[#e4fff6] py-2 text-sm font-semibold text-[#1b6b5f] hover:bg-[#1b6b5f] hover:text-white transition-colors">
                <Edit size={16} /> Edit
            </button>
            <button type="button" onClick={onDelete} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                <Trash2 size={16} /> Delete
            </button>
        </div>
    </article>
);

export default RoomInventoryCard;
