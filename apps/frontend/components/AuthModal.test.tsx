import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import AuthModal from "./AuthModal";
import { authClient } from "@/src/core/api/auth/auth.client";

// Mock the useAuth hook so it doesn't look for a Provider
vi.mock("./Providers", () => ({
    useAuth: () => ({
        user: null,
        setUser: vi.fn(),
        logout: vi.fn(),
    }),
}));

// Mock for auth.client
vi.mock("@/src/core/api/auth/auth.client", () => ({
    authClient: {
        login: vi.fn(),
        register: vi.fn(),
    },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock Auth Context
vi.mock('@/src/core/context/AuthContext', () => ({
    useAuth: () => ({
        setUser: vi.fn(),
    }),
}));

describe("AuthModal Component", () => {
    const mockOnClose = vi.fn();
    const mockSetType = vi.fn();

    it("renders the login form by default", () => {
        render(<AuthModal isOpen={true} type="Login" onClose={mockOnClose} setType={mockSetType} />);
        expect(screen.getByText(/Welcome back, You little worm!/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    });

    it("successfully logs in and redirects the user", async () => {
        (authClient.login as any).mockResolvedValue({
            ok: true,
            data: { user: { id: "1", email: "test@test.com" } }
        });

        render(<AuthModal isOpen={true} type="Login" onClose={mockOnClose} setType={mockSetType} />);

        fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "test@test.com" } });
        fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

        await waitFor(() => {
            expect(authClient.login).toHaveBeenCalledWith({
                email: "test@test.com",
                password: "password123"
            });
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it("displays error message from server on failed login", async () => {
        (authClient.login as any).mockResolvedValue({
            ok: false,
            error: { message: "Invalid credentials" }
        });

        render(<AuthModal isOpen={true} type="Login" onClose={mockOnClose} setType={mockSetType} />);

        fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "wrong@test.com" } });
        fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrongpass" } });

        fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

        expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
    });

    it("displays connection error if the API call fails entirely", async () => {
        (authClient.login as any).mockRejectedValue(new Error("Network Error"));

        render(<AuthModal isOpen={true} type="Login" onClose={mockOnClose} setType={mockSetType} />);

        fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "test@test.com" } });
        fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

        expect(await screen.findByText(/Connection failed/i)).toBeInTheDocument();
    });

    it("shows validation error if passwords do not match during registration", async () => {
        render(<AuthModal isOpen={true} type="Register" onClose={mockOnClose} setType={mockSetType} />);

        fireEvent.change(screen.getByPlaceholderText("Email Address"), { target: { value: "test@test.com" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm Email Address"), { target: { value: "test@test.com" } });
        fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "wrongpass" } });

        fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

        expect(await screen.findByText(/Passwords do not match!/i)).toBeInTheDocument();
    });

    it("disables the submit button while loading", async () => {
        (authClient.login as any).mockReturnValue(new Promise(() => {}));

        render(<AuthModal isOpen={true} type="Login" onClose={mockOnClose} setType={mockSetType} />);

        fireEvent.change(screen.getByPlaceholderText("Email Address"), {
            target: { value: "test@example.com" }
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "password123" }
        });

        const submitBtn = screen.getByRole("button", { name: /Sign In/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(submitBtn).toBeDisabled();
        });

        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
    });
});