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
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        mode: 'default' | 'roles';
        targetUser: UserAuthView | null;
    }>({
        isOpen: false,
        mode: 'default',
        targetUser: null
    });

    const fetchUsers = useCallback(async (query = '') => {
        console.log("fetching users");
        setLoading(true);
        const result = await authClient.searchUsers({ query, limit: 10 });
        if (result.ok) {
            setData(result.data);
            setHasLoadedOnce(true);
        } else {
            console.error("Failed to fetch users:", result.error.message);
        }
        setLoading(false);
    }, []);

    // Initial load has no search input
    useEffect(() => {
        void fetchUsers();
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        void fetchUsers(query);
    }, [fetchUsers]);

    const handleToggleStatusClick = (user: UserAuthView) => {
        setModalConfig({ isOpen: true, mode: "default", targetUser: user });
    };

    const handleEditRolesClick = (user: UserAuthView) => {
        setModalConfig({ isOpen: true, mode: "roles", targetUser: user });
    };

    const handleConfirmAction = async (payload: string | string[]) => {
        const user = modalConfig.targetUser;
        if (!user) return;

        if (modalConfig.mode === 'roles') {
            // Handle Role Update
            const result = await authClient.setUserRoles(user.id, { roles: payload as string[] });
            if (!result.ok) console.error("Role update failed:", result.error.message);
        } else {
            // Handle Status Toggle (Ban/Unban)
            const isBanning = user.status === 'active';
            const reason = typeof payload === 'string' ? payload : 'Admin action';

            const result = isBanning
                ? await authClient.disableUser(user.id, { reason })
                : await authClient.enableUser(user.id, { reason: 'Admin unban' });

            if (!result.ok) console.error("Status update failed:", result.error.message);
        }

        await fetchUsers(searchQuery);
        setModalConfig({ isOpen: false, mode: 'default', targetUser: null });
    };

    return (
        <div className="container mx-auto py-8 px-4 min-h-[80vh]">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            <div className="mb-6">
                <UserSearchForm onSearch={handleSearch} />
            </div>

            <UserTable
                users={data?.items || []}
                isLoading={loading && !hasLoadedOnce}
                onEditStats={(id) => console.log("Stats for", id)}
                onToggleStatus={handleToggleStatusClick}
                onEditRoles={handleEditRolesClick}
            />

            <AdminActionModal
                isOpen={modalConfig.isOpen}
                mode={modalConfig.mode}
                title={modalConfig.mode === 'roles' ? 'Manage Roles' : (modalConfig.targetUser?.status === 'active' ? 'Disable User' : 'Enable User')}
                description={modalConfig.mode === 'roles'
                    ? `Assign roles for ${modalConfig.targetUser?.username}`
                    : `Are you sure you want to change the status for ${modalConfig.targetUser?.username}?`}
                currentRoles={modalConfig.targetUser?.roles || []}
                requireReason={modalConfig.mode === 'default' && modalConfig.targetUser?.status === 'active'}
                onConfirm={handleConfirmAction}
                onClose={() => setModalConfig({ isOpen: false, mode: 'default', targetUser: null })}
            />
        </div>
    );
}