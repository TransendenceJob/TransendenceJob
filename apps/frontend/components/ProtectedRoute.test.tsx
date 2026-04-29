import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/Providers";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/src/core/api/auth/auth.client";

vi.mock("@/components/Providers", () => ({
    useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(),
}));

vi.mock("@/src/core/api/auth/auth.client", () => ({
    authClient: { getMe: vi.fn() },
}));

describe("ProtectedRoute Behavior", () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        (useRouter as any).mockReturnValue({ push: mockPush });
        (usePathname as any).mockReturnValue("/protected-zone");
    });

    it("shows loading spinner initially", () => {
        (useAuth as any).mockReturnValue({ isLoading: true, isAuthenticated: false });
        render(<ProtectedRoute>Secret Content</ProtectedRoute>);

        expect(screen.getByText((content) => content.includes('Establishing'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Connection'))).toBeInTheDocument();
    });

    it("blocks access and shows Security Breach when unauthorized", () => {
        (useAuth as any).mockReturnValue({ isLoading: false, isAuthenticated: false });
        render(<ProtectedRoute>Secret Content</ProtectedRoute>);

        expect(screen.getByText(/Security/i)).toBeInTheDocument();
        expect(screen.getByText(/Breach/i)).toBeInTheDocument();

        expect(screen.getByText(/STATUS: UNAUTHORIZED_ACCESS/i)).toBeInTheDocument();

        expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
    });

    it("redirects to login after 10 seconds when unauthorized", () => {
        vi.useFakeTimers();

        (useAuth as any).mockReturnValue({
            isLoading: false,
            isAuthenticated: false
        });

        render(<ProtectedRoute>Secret Content</ProtectedRoute>);

        vi.advanceTimersByTime(10000);

        expect(mockPush).toHaveBeenCalledWith("/?showLogin=true");

        vi.useRealTimers();
    });

    it("allows access when authenticated", () => {
        (useAuth as any).mockReturnValue({ isLoading: false, isAuthenticated: true });
        render(<ProtectedRoute>Secret Content</ProtectedRoute>);
        expect(screen.getByText("Secret Content")).toBeInTheDocument();
    });

    it("performs active validation when pathname changes", async () => {
        (useAuth as any).mockReturnValue({ isLoading: false, isAuthenticated: true });
        sessionStorage.setItem("auth.accessToken", "test-token");

        render(<ProtectedRoute>Secret Content</ProtectedRoute>);


        await waitFor(() => {
            expect(authClient.getMe).toHaveBeenCalled();
        });
    });
    it("calls getMe when authenticated and token exists", async () => {
        (useAuth as any).mockReturnValue({
            isLoading: false,
            isAuthenticated: true
        });

        sessionStorage.setItem("auth.accessToken", "test-token");

        render(<ProtectedRoute>Secret Content</ProtectedRoute>);

        await waitFor(() => {
            expect(authClient.getMe).toHaveBeenCalledWith();
        });
    });
});