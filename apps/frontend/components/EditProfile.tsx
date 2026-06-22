"use client";

import { useEffect, useId, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { saveMyProfile } from "@/src/core/api/profile/profile.client";

type EditProfileModalProps = {
    open: boolean;
    onClose?: () => void;
    onSaved?: () => Promise<void> | void;
    displayName?: string;
    bio?: string;
    email?: string;
    onAvatarCropped?: (blob: Blob) => void;
    setProfile?: (profile: any) => void;
};

export default function EditProfileModal({
    open,
    onClose,
    onSaved,
    displayName,
    bio: initialBio,
    email,
    onAvatarCropped,
}: EditProfileModalProps) {
    const editorRef = useRef<any>(null);
    const fileInputId = useId();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarScale, setAvatarScale] = useState(1.2);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
    const [formDisplayName, setFormDisplayName] = useState(displayName ?? "");
    const [bio, setBio] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setAvatarFile(null);
        setAvatarBlob(null);
        setAvatarScale(1.2);
        setFormDisplayName(displayName ?? "");
        setBio(initialBio ?? "");
        setSaveFeedback(null);
        setSaveError(null);
    }, [open, displayName, initialBio]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    if (!open) {
        return null;
    }

    const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setAvatarFile(file);
        setSaveFeedback(null);

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
        }
    };

    const handleAvatarSave = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const canvas = editor.getImageScaledToCanvas();
        canvas.toBlob((blob: Blob | null) => {
            if (!blob) return;
            setAvatarBlob(blob);
            onAvatarCropped?.(blob);
            const preview = URL.createObjectURL(blob);
            setAvatarPreview((current) => {
                if (current) URL.revokeObjectURL(current);
                return preview;
            });
            setSaveFeedback("Avatar cropped locally. Hook this to the BFF next.");
        }, "image/png");
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveFeedback(null);
        setSaveError(null);

        try {
            const result = await saveMyProfile({
                displayName: formDisplayName.trim() || undefined,
                bio: bio.trim() || undefined,
                avatar: avatarBlob,
            });

            if (!result.ok) {

                setSaveError(result.error);
                return;
            }
            setSaveFeedback("Profile saved successfully.");
			await onSaved?.();
			// Keep parent in sync if it wants the returned profile data later.
			onAvatarCropped?.(avatarBlob ?? new Blob());
            onClose?.();
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Edit profile</p>
                        <h2 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-50">Update your profile</h2>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            Placeholder modal shell for avatar, bio, and account fields.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                        Close
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                    <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            {/*<div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Avatar</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload and crop</p>
                            </div>*/}
                            <label
                                htmlFor={fileInputId}
                                className="cursor-pointer w-full rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            >
                                Choose file
                            </label>
                        </div>

                        <input
                            id={fileInputId}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarSelect}
                        />

                        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                            {avatarFile ? (
                                <AvatarEditor
                                    ref={editorRef}
                                    image={avatarFile}
                                    width={220}
                                    height={220}
                                    border={24}
                                    borderRadius={110}
                                    scale={avatarScale}
                                    style={{ width: "100%", height: "auto" }}
                                />
                            ) : (
                                <div className="flex aspect-square items-center justify-center text-5xl text-zinc-400 dark:text-zinc-500">
                                    🪱
                                </div>
                            )}
                        </div>

                        <label className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Zoom
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={avatarScale}
                                onChange={(event) => setAvatarScale(Number(event.target.value))}
                                className="accent-zinc-900 dark:accent-zinc-100"
                            />
                        </label>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleAvatarSave}
                                disabled={!avatarFile}
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white"
                            >
                                Preview
                            </button>
                            {avatarPreview && (
                                <div className="h-15 w-15 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800">
                                    <img src={avatarPreview} alt="Cropped avatar preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>

                        {saveFeedback && (
                            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{saveFeedback}</p>
                        )}
                    </section>

                    <section className="grid gap-4">
                        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Display name
                            <input
                                type="text"
                                value={formDisplayName}
                                onChange={(event) => setFormDisplayName(event.target.value)}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Email
                            <input
                                type="email"
                                defaultValue={email ?? ""}
                                readOnly
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Managed by auth profile.</span>
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Bio
                            <textarea
                                rows={5}
                                placeholder="Tell others a little about yourself"
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                        </label>

                        {saveError && (
                            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                {saveError}
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white"
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>

                        {saveFeedback && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{saveFeedback}</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}