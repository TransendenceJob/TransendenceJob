import React, { useState } from 'react';

interface AdminModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    requireReason?: boolean;
    onConfirm: (reason?: string) => void;
    onClose: () => void;
}

export const AdminActionModal: React.FC<AdminModalProps> = (
    {isOpen, title, description, requireReason, onConfirm, onClose
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-4">{description}</p>

                {requireReason && (
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded mb-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter reason..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                )}

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={requireReason && !reason.trim()}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};