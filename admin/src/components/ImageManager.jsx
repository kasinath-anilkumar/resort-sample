import React from 'react';
import { Loader2, ImagePlus, X } from 'lucide-react';

const ImageManager = ({ label = 'Images', images, uploading, onUpload, onRemove }) => (
    <div className="w-full">
        {/* LABEL */}
        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
            {label}
        </label>

        {/* MAIN LAYOUT */}
        <div className="flex gap-4 items-start">
            {/* LEFT: Upload */}
            <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-[#1b6b5f] hover:text-[#1b6b5f] transition">
                {uploading
                    ? <Loader2 className="animate-spin" size={18} />
                    : <ImagePlus size={18} />
                }
                <span className="mt-1 text-xs">Upload</span>
                <input type="file" multiple onChange={onUpload} className="hidden" />
            </label>

            {/* RIGHT: Images */}
            <div className="flex-1 flex flex-wrap gap-3">
                {images.map((img, index) => (
                    <div
                        key={`${img}-${index}`}
                        className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                        <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded p-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default ImageManager;
