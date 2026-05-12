import React, {useEffect, useState} from 'react';

interface AdminModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    requireReason?: boolean;
    mode?: 'default' | 'roles';
    currentRoles?: string[];
    onConfirm: (payload: any) => void;
    onClose: () => void;
}

export const AdminActionModal: React.FC<AdminModalProps> = (
    {isOpen, title, description, requireReason, mode = 'default', currentRoles = [], onConfirm, onClose
}) => {
    const [reason, setReason] = useState('');
    const availableRoles = ['admin', 'user'];
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && mode === 'roles') {
            setSelectedRoles(currentRoles);
        }
    }, [isOpen, mode, currentRoles]);

    if (!isOpen) return null;

    const handleRoleToggle = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const handleConfirm = () => {
        if (mode === 'roles') {
            onConfirm(selectedRoles);
        } else {
            onConfirm(reason);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{description}</p>

                {mode === 'roles' ? (
                    <div className="mb-6 space-y-2">
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                            Select Permissions
                        </label>
                        {availableRoles.map(role => (
                            <label key={role} className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={selectedRoles.includes(role)}
                                    onChange={() => handleRoleToggle(role)}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                                    {role}
                                </span>
                            </label>
                        ))}
                        {selectedRoles.length === 0 && (
                            <p className="text-xs text-red-500 mt-2 italic">
                                * User must have at least one role.
                            </p>
                        )}
                    </div>
                ) : requireReason && (
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Required Reason</label>
                        <textarea
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            placeholder="Why is this action being taken?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                        disabled={(requireReason && !reason.trim()) || (mode === 'roles' && selectedRoles.length === 0)}
                    >
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
};