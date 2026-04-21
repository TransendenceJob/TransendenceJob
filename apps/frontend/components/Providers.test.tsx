import { render, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Providers, { useAuth } from "@/components/Providers";
import { authClient } from "@/src/core/api/auth/auth.client";

vi.mock("@/src/core/api/auth/auth.client", () => ({
    authClient: {
        getMe: vi.fn(),
        logout: vi.fn(),
    },
}));

// Helper component to call useAuth
const TestConsumer = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div>Loading...</div>;
    return (
        <div>
            {isAuthenticated ? `In: ${user?.email}` : "Out"}
        </div>
    );
};

describe("Providers - Auth State Transitions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("bootstraps user from localStorage successfully", async () => {
        localStorage.setItem("accessToken", "valid-token");
        (authClient.getMe as any).mockResolvedValue({
            ok: true,
            data: { user: { email: "test@test.com" } }
        });

        const { getByText } = render(
            <Providers>
                <TestConsumer />
            </Providers>
        );

        expect(getByText(/Loading.../i)).toBeInTheDocument();
        await waitFor(() => expect(getByText(/In: test@test.com/i)).toBeInTheDocument());
    });

    it("triggers logout state when 'auth-unauthorized' event is fired", async () => {
        // Start logged in
        localStorage.setItem("accessToken", "expiring-token");
        (authClient.getMe as any).mockResolvedValue({
            ok: true,
            data: { user: { email: "zombie@42.de" } }
        });

        const { getByText } = render(
            <Providers>
                <TestConsumer />
            </Providers>
        );

        await waitFor(() => expect(getByText(/In: zombie@42.de/i)).toBeInTheDocument());

        act(() => {
            window.dispatchEvent(new Event("auth-unauthorized"));
        });

        await waitFor(() => {
            expect(getByText("Out")).toBeInTheDocument();
            expect(localStorage.getItem("accessToken")).toBeNull();
        });
    });
});