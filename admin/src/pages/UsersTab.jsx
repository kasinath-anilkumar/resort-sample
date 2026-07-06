import React from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../api';
import Panel from '../components/Panel';

const UsersTab = ({ users, refetch, authConfig }) => {
    const deleteUser = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await API.delete(`/users/${id}`, authConfig);
            toast.success('User removed');
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <Panel title="Users" subtitle="Guest accounts and admin markers.">
            <div className="grid gap-3">
                {users.map((item) => (
                    <div key={item._id} className="flex items-center justify-between border border-slate-200 bg-white p-4">
                        <div>
                            <p className="font-semibold text-slate-950">
                                {item.name} {item.isAdmin && <span className="ml-2 rounded bg-[#e4fff6] px-2 py-1 text-xs text-[#1b6b5f]">Admin</span>}
                            </p>
                            <p className="text-sm text-slate-500">{item.email}</p>
                        </div>
                        {!item.isAdmin && (
                            <button type="button" onClick={() => deleteUser(item._id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </Panel>
    );
};

export default UsersTab;
