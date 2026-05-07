import React from 'react';

import {UserAuthView} from "@/src/core/api/auth/auth.types";

interface UserTableProps {
    users: UserAuthView[];
    isLoading: boolean;
    onEditStats: (userId: string) => void;
    onToggleStatus: (user: UserAuthView) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, isLoading, onEditStats, onToggleStatus }) => {
    if (isLoading) return <div>Loading users...</div>;

    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
                <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.username || 'No Username'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.status}
              </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.roles?.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => onEditStats(user.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4">
                            Edit Stats
                        </button>
                        <button
                            onClick={() => onToggleStatus(user)}
                            className="text-red-600 hover:text-red-900">
                            {user.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
};