'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/src/core/api/auth/auth.client';
import { UserAuthView, UserSearchResponse, ConfirmAction, PlayerStatsData, UpdatePlayerStatsRequest, MIN_STAT_LIMIT, MAX_STAT_LIMIT, playerStatsValidationSchema
} from '@/src/core/api/auth/auth.types';
import { UserTable } from '@/src/components/admin/UserTable';
import { UserSearchForm } from '@/src/components/admin/UserSearchForm';
import { AdminActionModal } from '@/src/components/admin/AdminActionModal';
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/Providers";
import {ZodError} from "zod";
import { Toaster, toast } from 'sonner';

export default function AdminUserManagement() {
    const { user, isLoading: authLoading } = useAuth();
    const [data, setData] = useState<UserSearchResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [activeUserStats, setActiveUserStats] = useState<PlayerStatsData | undefined>(undefined);
    const [cursorHistory, setCursorHistory] = useState<string[]>([]); // saves previous last entry
    const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
    const ITEMS_PER_PAGE = 10;

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        mode: ConfirmAction['mode'];
        targetUser: UserAuthView | null;
    }>({
        isOpen: false,
        mode: 'default',
        targetUser: null
    });

    const fetchUsers = useCallback(async (query = '', cursor?: string) => {
        console.log("fetching users");
        setLoading(true);
        const result = await authClient.searchUsers({
            query,
            limit: ITEMS_PER_PAGE,
            cursor: cursor
        });
        if (result.ok) {
            setData(result.data);
            setHasLoadedOnce(true);
        } else {
            console.error("Failed to fetch users:", result.error.message);
            toast.error("Failed to refresh user list.");
        }
        setLoading(false);
    }, []);

    // Initial load has no search input
    useEffect(() => {
        if (authLoading) return;
        const isAdmin = user?.roles && user.roles.includes('admin');

        if (isAdmin) {
            void fetchUsers();
        }
    }, [authLoading, user, fetchUsers, currentCursor, searchQuery]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCurrentCursor(undefined);
        setCursorHistory([]);
        void fetchUsers(query, undefined);
    }, [fetchUsers]);

    const handleNextPage = () => {
        const nextCursor = data?.pageInfo?.nextCursor || (data?.pageInfo as any)?.endCursor;

        if (!nextCursor) return;

        setCursorHistory(prev => [...prev, currentCursor || '']);
        setCurrentCursor(nextCursor);
        void fetchUsers(searchQuery, nextCursor);
    };

    const handlePreviousPage = () => {
        if (cursorHistory.length === 0) return;

        const previousHistory = [...cursorHistory];
        const targetCursor = previousHistory.pop();

        setCursorHistory(previousHistory);
        setCurrentCursor(targetCursor === '' ? undefined : targetCursor);
        void fetchUsers(searchQuery, targetCursor === '' ? undefined : targetCursor);
    };

    const handleEditStatsClick = async (userId: string) => {
        const selectedUser = data?.items.find(u => u.id === userId);
        if (!selectedUser) return;


        setModalConfig({
            isOpen: true,
            mode: 'stats',
            targetUser: selectedUser
        });

        setActiveUserStats(undefined);

        const response = await authClient.getPlayerStats(userId);
        if (response.ok) {
            setActiveUserStats(response.data);
        } else {
            console.error("Could not fetch user stats:", response.error.message);
        }
    };

    const handleToggleStatusClick = (user: UserAuthView) => {
        setModalConfig({ isOpen: true, mode: "default", targetUser: user });
    };

    const handleEditRolesClick = (user: UserAuthView) => {
        setModalConfig({ isOpen: true, mode: "roles", targetUser: user });
    };

    const handleKickSessionsClick = (user: UserAuthView) => {
        setModalConfig({ isOpen: true, mode: "kick", targetUser: user });
    };

    const handleConfirmAction = async (action: ConfirmAction) => {
        const user = modalConfig.targetUser;
        if (!user) return;

        const reason = action.payload && typeof action.payload === 'string' && action.payload.length >= 3
            ? action.payload
            : 'Administrative action override';

        if (action.mode === 'stats') {
            // Handle Stats update
            try {
                const sanitizedStats = playerStatsValidationSchema.parse(action.payload);
                const result = await authClient.updatePlayerStats(user.id, sanitizedStats);

                if (!result.ok) {
                    toast.error(`Failed to save stats: ${result.error.message}`);
                    return;
                }
                toast.success("Player stats updated successfully!");

            } catch (error: any) {
                if (error instanceof ZodError) {
                    const errorMessage = error.issues.map(e => e.message).join("\n");
                    toast.error(`Validation Error: ${errorMessage}`);
                } else {
                    toast.error("An unexpected validation issue occurred.");
                }
                return;
            }
        }
        else if (action.mode === 'roles') {
            // Handle Role Update
            try {
                const result = await authClient.setUserRoles(user.id, {roles: action.payload});

                if (!result.ok) {
                    console.error("Role update failed:", result.error.message);
                    toast.error(`Failed to update roles: ${result.error.message}`);
                    return;
                }
                toast.success(`Roles updated successfully for ${user.username}!`);

            } catch (error) {
                console.error("Unexpected role update error:", error);
                toast.error("Network or server failure while updating roles.");
                return;
            }
        }
        // handle kick button
        else if (action.mode === 'kick') {
            try {
                const kickResult = await authClient.revokeUserSessions(user.id, { reason });
                if (kickResult.ok) {
                    toast.success(`Successfully terminated ${kickResult.data.revokedSessions} active session(s) for ${user.username}.`);
                } else {
                    toast.error(`Failed to terminate sessions: ${kickResult.error.message}`);
                    return;
                }
            } catch (error) {
                toast.error("Network error while attempting session revocation.");
                return;
            }
        }
        else {
            // Handle BanToggle
            try {
                const isBanning = user.status === 'active';

                const result = isBanning
                    ? await authClient.disableUser(user.id, {reason})
                    : await authClient.enableUser(user.id, {reason: 'Admin unban'});

                if (!result.ok) {
                    console.error("Status update failed:", result.error.message);
                    toast.error(`Failed to update user status: ${result.error.message}`);
                    return;
                }

                if (isBanning) {
                    const kickResult = await authClient.revokeUserSessions(user.id, {reason});
                    if (kickResult.ok) {
                        toast.success(`${user.username} has been successfully banned.`);
                    } else {
                        console.warn("User disabled, but active session kick failed:", kickResult.error.message);
                        toast.success(`${user.username} has been banned, but active sessions failed to clear immediately.`);
                    }
                } else {
                    toast.success(`${user.username} has been successfully reinstated.`);
                }

            } catch (error) {
                console.error("Unexpected status update error:", error);
                toast.error("Network or server failure while modifying account status.");
                return;
            }
        }

        await fetchUsers(searchQuery);
        setModalConfig({isOpen: false, mode: 'default', targetUser: null});
    };

    const hasNextCursor = !!data?.pageInfo?.nextCursor || (data?.pageInfo as any)?.endCursor;

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminErrorBoundary>
                <Toaster position="top-right" richColors/>
                <div className="container mx-auto py-8 px-4 min-h-[80vh]">
                    <h1 className="text-2xl font-bold mb-6">User Management</h1>

                    <div className="mb-6">
                        <UserSearchForm onSearch={handleSearch}/>
                    </div>

                    <UserTable
                        users={data?.items || []}
                        isLoading={loading && !hasLoadedOnce}
                        onEditStats={handleEditStatsClick}
                        onToggleStatus={handleToggleStatusClick}
                        onEditRoles={handleEditRolesClick}
                        onKickSessions={handleKickSessionsClick}
                        canGoPrevious={cursorHistory.length > 0}
                        canGoNext={hasNextCursor}
                        onNextPage={handleNextPage}
                        onPreviousPage={handlePreviousPage}
                    />

                    <AdminActionModal
                        isOpen={modalConfig.isOpen}
                        mode={modalConfig.mode}
                        title={
                            modalConfig.mode === 'roles' ? 'Manage Roles' :
                                modalConfig.mode === 'stats' ? 'Edit Player Stats' : modalConfig.mode === 'kick' ? 'Force Disconnect User' :
                                    (modalConfig.targetUser?.status === 'active' ? 'Disable User' : 'Enable User')
                        }
                        description={
                            modalConfig.mode === 'roles' ? `Assign roles for ${modalConfig.targetUser?.username}` :
                                modalConfig.mode === 'stats' ? `Updating gameplay metrics for ${modalConfig.targetUser?.username}` :
                                    `Are you sure you want to change the status for ${modalConfig.targetUser?.username}?`
                        }
                        currentRoles={modalConfig.targetUser?.roles || []}
                        currentStats={activeUserStats}
                        onConfirm={handleConfirmAction}
                        onClose={() => {
                            setModalConfig({isOpen: false, mode: 'default', targetUser: null});
                            setActiveUserStats(undefined);
                        }}
                    />
                </div>
            </AdminErrorBoundary>
        </ProtectedRoute>
    );
}

class AdminErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Admin Panel Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container mx-auto py-12 px-4 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto shadow-sm">
                        <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h2>
                        <p className="text-sm text-red-600 mb-6">
                            The Admin Dashboard encountered a rendering error.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
                        >
                            Reload Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}