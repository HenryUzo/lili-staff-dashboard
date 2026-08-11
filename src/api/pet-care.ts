import { api } from "@/api/http";
import type { PetCareArticle, PetCareArticleInput, PetCarePublishingStatus, PetCareReviewer, PetCareReviewerInput } from "@/types/api";

export interface PetCareFilters {
  status?: PetCarePublishingStatus | "ALL";
  category?: string;
  reviewerId?: string;
  stale?: boolean;
  search?: string;
}

export async function getPetCareArticles(filters: PetCareFilters) {
  const response = await api.get<{ items: PetCareArticle[] }>("/api/admin/pet-care/articles", {
    params: {
      status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
      category: filters.category || undefined,
      reviewerId: filters.reviewerId || undefined,
      stale: filters.stale ? "true" : undefined,
      search: filters.search || undefined
    }
  });
  return response.data.items;
}

export async function getPetCareArticle(id: string) {
  return (await api.get<PetCareArticle>(`/api/admin/pet-care/articles/${id}`)).data;
}

export async function uploadPetCareHeroImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return (await api.post<{
    url: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }>("/api/admin/pet-care/images", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })).data;
}

export async function getPetCareReviewers() {
  const response = await api.get<{ items: PetCareReviewer[] }>("/api/admin/pet-care/reviewers");
  return response.data.items;
}

export async function updatePetCareReviewer(id: string, input: Partial<PetCareReviewer>) {
  return (await api.patch<PetCareReviewer>(`/api/admin/pet-care/reviewers/${id}`, input)).data;
}

export async function createPetCareReviewer(input: PetCareReviewerInput) {
  return (await api.post<PetCareReviewer>("/api/admin/pet-care/reviewers", input)).data;
}

export async function sendPetCareReviewInvitation(id: string) {
  return (await api.post<{
    recipient: string;
    invitationSentAt: string;
    expiresAt: string;
  }>(`/api/admin/pet-care/articles/${id}/review-invitation`)).data;
}

export async function createPetCareArticle(input: PetCareArticleInput) {
  return (await api.post<PetCareArticle>("/api/admin/pet-care/articles", input)).data;
}

export async function updatePetCareArticle(id: string, input: Partial<PetCareArticleInput>) {
  return (await api.patch<PetCareArticle>(`/api/admin/pet-care/articles/${id}`, input)).data;
}

export async function runPetCareArticleAction(id: string, action: "submit-review" | "publish" | "archive") {
  return (await api.post<PetCareArticle>(`/api/admin/pet-care/articles/${id}/${action}`)).data;
}

export async function createPetCarePreviewShare(id: string, shareType: "COMMENT" | "REVIEWER") {
  return (await api.post<{ token: string; shareType: "COMMENT" | "REVIEWER"; expiresAt: string }>(
    `/api/admin/pet-care/articles/${id}/preview-shares`,
    { shareType, expiresInDays: 7 }
  )).data;
}
