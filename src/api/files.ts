import { api } from "@/api/http";

export async function fetchStaffFile(fileId: string) {
  const response = await api.get<Blob>(`/api/files/${fileId}/content`, {
    responseType: "blob"
  });

  return response.data;
}
