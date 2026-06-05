import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import EditProfileModal from "./EditProfile";
import { saveMyProfile } from "@/src/core/api/profile/profile.client";

vi.mock("react-avatar-editor", () => ({
    default: () => <div data-testid="avatar-editor" />,
}));

vi.mock("@/src/core/api/profile/profile.client", () => ({
    saveMyProfile: vi.fn(),
}));

describe("EditProfileModal save flow", () => {
    const mockOnClose = vi.fn();
    const mockOnSaved = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("saves the profile and notifies the parent after pressing Save", async () => {
        (saveMyProfile as any).mockResolvedValue({ ok: true, data: {}, status: 200 });

        render(
            <EditProfileModal
                open={true}
                onClose={mockOnClose}
                onSaved={mockOnSaved}
                displayName="worm42"
                email="worm@example.com"
            />,
        );

        fireEvent.change(screen.getByPlaceholderText(/Tell others a little about yourself/i), {
            target: { value: "  updated bio  " },
        });

        fireEvent.click(screen.getByRole("button", { name: /Save/i }));

        await waitFor(() => {
            expect(saveMyProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    displayName: "worm42",
                    bio: "updated bio",
                    avatar: null,
                }),
            );
            expect(mockOnSaved).toHaveBeenCalledTimes(1);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText(/Profile saved successfully/i)).toBeInTheDocument();
    });
});
