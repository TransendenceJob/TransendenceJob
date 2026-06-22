import React, {JSX, useEffect, useState} from 'react';
import {
    UpdatePlayerStatsRequest,
    ConfirmAction,
    PlayerStatsData,
    MAX_STAT_LIMIT,
    adminActionSchema
} from '@/src/core/api/auth/auth.types';
import {toast} from "sonner";

interface AdminModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    mode: ConfirmAction['mode'];
    currentRoles?: string[];
    currentStats?: PlayerStatsData;
    onConfirm: (action: ConfirmAction) => void;
    onClose: () => void;
}

export function AdminActionModal(
    {isOpen, title, description, mode = 'default', currentRoles = [], currentStats, onConfirm, onClose
    }: AdminModalProps): JSX.Element | null { // expect a React ui or when fail render nothing

    const availableRoles = ['admin', 'user'];
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [actionReason, setActionReason] = useState<string>('');
    const [statsInputs, setStatsInputs] = useState<Record<string, string>>({
        level: '0', xp: '0', wins: '0', losses: '0', kills: '0', deaths: '0'
    });

    useEffect(() => {
        if (isOpen) {
            setActionReason('');
            if (mode === 'roles')
                setSelectedRoles(currentRoles);
            if (mode === 'stats')
                setStatsInputs({
                    level: currentStats?.level?.toString() ?? '1',
                    xp: currentStats?.xp?.toString() ?? '0',
                    wins: currentStats?.wins?.toString() ?? '0',
                    losses: currentStats?.losses?.toString() ?? '0',
                    kills: currentStats?.kills?.toString() ?? '0',
                    deaths: currentStats?.deaths?.toString() ?? '0'
                });
        }
    }, [isOpen, mode, currentRoles, currentStats]);

    if (!isOpen) return null;

    const handleRoleToggle = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const handleStatChange = (key: string, value: string) => {
        if (value === '') {
            setStatsInputs(prev => ({ ...prev, [key]: '' }));
            return;
        }

        if (/^[0-9]+$/.test(value)) {
            const numericValue = Number(value);

            if (numericValue > MAX_STAT_LIMIT) {
                setStatsInputs(prev => ({...prev, [key]: MAX_STAT_LIMIT.toString()}));
            } else {
                setStatsInputs(prev => ({...prev, [key]: value}));
            }
        }
    };

    const handleConfirm = () => {
        if (mode === 'roles') {
            onConfirm({ mode: 'roles', payload: selectedRoles });
        } else if (mode === 'stats') {
            const rawStats = {
                level: statsInputs.level || '0',
                xp: statsInputs.xp || '0',
                wins: statsInputs.wins || '0',
                losses: statsInputs.losses || '0',
                kills: statsInputs.kills || '0',
                deaths: statsInputs.deaths || '0',
            };
            onConfirm({ mode: 'stats', payload: rawStats as unknown as UpdatePlayerStatsRequest
            });
        } else if (mode === 'kick') {
            onConfirm({ mode: 'kick', payload: actionReason.trim() });
        } else {
            const validation = adminActionSchema.safeParse({ reason: actionReason });

            if (!validation.success) {
                const errorMsg = validation.error.issues[0]?.message || "Invalid input";
                toast.error(errorMsg);
                return;
            }

            const cleanReason = validation.data.reason || 'Administrative action override';

            onConfirm({
                mode: mode,
                payload: cleanReason
            });
        }
    };

    const showReasonField = mode === 'kick' || mode === 'default';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 overflow-y-auto max-h-[95vh]">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{description}</p>

                {/* --- ROLE MANAGEMENT UI --- */}
                {mode === 'roles' && (
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
                )}

                {/* --- PLAYER STATS UI --- */}
                {mode === 'stats' && (
                    <div className="mb-6 space-y-4">
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                            Gameplay Metrics
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['level', 'xp', 'wins', 'losses', 'kills', 'deaths'] as const).map((key) => (
                                <div key={key}>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                        {key}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={statsInputs[key]}
                                        onChange={(e) => handleStatChange(key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* --- BAN REASON FIELD --- */}
                {showReasonField && (
                    <div className="mb-6 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">
                            Action Reason (Optional)
                        </label>
                        <textarea
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-20"
                            placeholder="Provide a clear reason for our audit logs..."
                            maxLength={255}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                        />
                    </div>
                )}
                {/* --- FOOTER ACTIONS --- */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100"
                        disabled={(mode === 'roles' && selectedRoles.length === 0)}
                    >
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
}