import { apiClient } from "@/lib/axios";

interface UploadResponse {
  url: string;
}

export const uploadService = {
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<UploadResponse>(
      "/uploads",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data.url;
  },

  async uploadAttachment(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<UploadResponse>(
      "/uploads/attachment",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.url;
  },
};
