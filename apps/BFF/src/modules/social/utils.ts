type UploadedMemoryFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

export function uploadedMemoryFileToForm(
  file: UploadedMemoryFile,
  fieldName = 'file',
  fallbackName = 'avatar.png',
) {
  const form = new FormData();
  const arrayBuffer = file.buffer!.buffer.slice(
    file.buffer!.byteOffset,
    file.buffer!.byteOffset + file.buffer!.byteLength,
  ) as ArrayBuffer;
  form.append(
    fieldName,
    new Blob([arrayBuffer], { type: file.mimetype ?? 'application/octet-stream' }),
    file.originalname ?? fallbackName,
  );
  return form;
}

export function sanitizeMetadata(input: unknown): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  if (typeof input === 'object' && input !== null) {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value === undefined || value === null || value === '') continue;
      metadata[key] = value;
    }
  }
  return metadata;
}
// kept helpers only: FormData builder and metadata sanitizer
