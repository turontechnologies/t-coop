/** localStorage has roughly a 5-10MB per-origin quota shared by the whole app — keep attachments small. */
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Couldn't read file"));
    reader.readAsDataURL(file);
  });
}
