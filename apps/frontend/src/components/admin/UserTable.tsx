import React, {JSX} from 'react';

import {UserAuthView} from "@/src/core/api/auth/auth.types";

interface UserTableProps {
    users: UserAuthView[];
    isLoading: boolean;
    onEditStats: (userId: string) => void;
    onToggleStatus: (user: UserAuthView) => void;
    onEditRoles: (user: UserAuthView) => void;
    onKickSessions: (user: UserAuthView) => void;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onNextPage: () => void;
    onPreviousPage: () => void;
}

export function UserTable(
    {users,
        isLoading,
        onEditStats,
        onToggleStatus,
        onEditRoles,
        onKickSessions,
        canGoPrevious,
        canGoNext,
        onNextPage,
        onPreviousPage,
    }: UserTableProps): JSX.Element | null {

    return (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm min-h-[400px] bg-white">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 mb-2"></div>
                        <span className="text-sm font-medium text-gray-600">Updating list...</span>
                    </div>
                </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && users.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                            No users found matching your criteria.
                        </td>
                    </tr>
                ) : (
                    users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.username || 'No Username'}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.status}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                    {user.roles?.map((role) => (
                                        <span
                                            key={role}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 capitalize">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onEditRoles(user)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                                    Edit Roles
                                </button>
                                <button
                                    onClick={() => onEditStats(user.id)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                                    Edit Stats
                                </button>
                                <button
                                    onClick={() => onKickSessions(user)}
                                    className="text-amber-600 hover:text-amber-900 mr-4 transition-colors">
                                    Kick Sessions
                                </button>
                                <button
                                    onClick={() => onToggleStatus(user)}
                                    className={`${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} transition-colors`}>
                                    {user.status === 'active' ? 'Disable' : 'Enable'}
                                </button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                <button
                    onClick={onPreviousPage}
                    disabled={!canGoPrevious || isLoading}
                    className="px-4 py-1.5 text-sm font-semibold text-gray-700 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
                >
                    Previous
                </button>
                <button
                    onClick={onNextPage}
                    disabled={!canGoNext || isLoading}
                    className="px-4 py-1.5 text-sm font-semibold text-gray-700 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
}