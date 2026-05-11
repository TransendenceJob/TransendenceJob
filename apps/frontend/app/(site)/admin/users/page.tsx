'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/src/core/api/auth/auth.client';
import { UserAuthView, UserSearchResponse } from '@/src/core/api/auth/auth.types';
import { UserTable } from '@/src/components/admin/UserTable';
import { UserSearchForm } from '@/src/components/admin/UserSearchForm';
import { AdminActionModal } from '@/src/components/admin/AdminActionModal';

export default function AdminUserManagement() {
    const [data, setData] = useState<UserSearchResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        targetUser: UserAuthView | null;
    }>({ isOpen: false, targetUser: null });

    const fetchUsers = useCallback(async (query = '') => {
        setLoading(true);
        const result = await authClient.searchUsers({ query, limit: 10 });
        if (result.ok) {
            setData(result.data);
        } else {
            console.error("Failed to fetch users:", result.error.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        fetchUsers(query);
    };

    const handleToggleStatusClick = (user: UserAuthView) => {
        setModalConfig({ isOpen: true, targetUser: user });
    };

    const confirmToggleStatus = async (reason?: string) => {
        const user = modalConfig.targetUser;
        if (!user) return;

        const isBanning = user.status === 'active';
        const result = isBanning
            ? await authClient.disableUser(user.id, { reason: reason || 'Admin action' })
            : await authClient.enableUser(user.id, { reason: 'Admin unban' });

        if (result.ok) {
            fetchUsers(searchQuery);
        }
        setModalConfig({ isOpen: false, targetUser: null });
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            <div className="mb-6">
                <UserSearchForm onSearch={handleSearch} />
            </div>

            <UserTable
                users={data?.items || []}
                isLoading={loading}
                onEditStats={(id) => console.log("Navigate to stats for", id)}
                onToggleStatus={handleToggleStatusClick}
            />

            <AdminActionModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.targetUser?.status === 'active' ? 'Disable User' : 'Enable User'}
                description={`Are you sure you want to ${modalConfig.targetUser?.status === 'active' ? 'disable' : 'enable'} ${modalConfig.targetUser?.username}?`}
                requireReason={modalConfig.targetUser?.status === 'active'}
                onConfirm={confirmToggleStatus}
                onClose={() => setModalConfig({ isOpen: false, targetUser: null })}
            />
        </div>
    );
}