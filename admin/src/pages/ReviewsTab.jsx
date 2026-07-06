import React from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../api';
import Panel from '../components/Panel';

const ReviewsTab = ({ reviews, refetch, authConfig }) => {
    const handleReviewAction = async (id, isApproved) => {
        try {
            await API.put(`/reviews/${id}/approve`, { isApproved }, authConfig);
            toast.success(isApproved ? 'Review approved' : 'Review rejected');
            refetch();
        } catch (error) {
            toast.error('Review update failed');
        }
    };

    return (
        <Panel title="Reviews" subtitle="Approve or hide guest reviews.">
            <div className="grid gap-4">
                {reviews.map((review) => (
                    <div key={review._id} className="border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold text-slate-950">{review.user?.name || 'Guest'} on {review.room?.name || 'Room'}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">"{review.comment}"</p>
                                <p className="mt-2 text-sm font-semibold text-[#1b6b5f]">{review.rating} stars</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleReviewAction(review._id, !review.isApproved)}
                                className={`rounded-lg px-3 py-2 text-sm font-bold ${review.isApproved ? 'bg-red-50 text-red-600' : 'bg-[#e4fff6] text-[#1b6b5f]'}`}
                            >
                                {review.isApproved ? <X size={16} /> : <Check size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
};

export default ReviewsTab;
