import { api } from "@/api/http";
import type { MarketingCampaign, MarketingContentBlock, MarketingEmailTemplate } from "@/types/api";

export type CampaignInput = { name: string; subject: string; previewText?: string | null; htmlContent: string; textContent: string; contentBlocks: MarketingContentBlock[]; templateId?: string | null; recipientSelectionConfirmed: boolean; designConfigured: boolean; audienceMode: "CONSENTED_CLIENTS" | "SELECTED_EMAILS"; recipientEmails: string[] };
export type MarketingRecipient = { id: string; name: string; email: string };

export async function getMarketingCampaigns() {
  return (await api.get<{ items: MarketingCampaign[] }>("/api/marketing/campaigns")).data.items;
}
export async function createMarketingCampaign(input: CampaignInput) {
  return (await api.post<MarketingCampaign>("/api/marketing/campaigns", input)).data;
}
export async function updateMarketingCampaign(id: string, input: Partial<CampaignInput>) {
  return (await api.patch<MarketingCampaign>(`/api/marketing/campaigns/${id}`, input)).data;
}
export async function sendMarketingCampaignTest(id: string, email: string) {
  return (await api.post<{ status: string }>(`/api/marketing/campaigns/${id}/test`, { email })).data;
}
export async function sendMarketingCampaign(id: string) {
  return (await api.post<MarketingCampaign>(`/api/marketing/campaigns/${id}/send`, { confirm: true })).data;
}
export async function searchMarketingRecipients(search?: string) {
  return (await api.get<{ items: MarketingRecipient[] }>("/api/marketing/recipients", { params: { search: search || undefined } })).data.items;
}
export async function validateMarketingRecipients(emails: string[]) {
  return (await api.post<{ recipientEmails: string[]; acceptedCount: number; suppressedCount: number; duplicateCount: number }>("/api/marketing/recipients/validate", { emails })).data;
}
export async function getMarketingTemplates() {
  return (await api.get<{ starterTemplates: MarketingEmailTemplate[]; savedTemplates: MarketingEmailTemplate[] }>("/api/marketing/templates")).data;
}
export async function getMarketingSender() {
  return (await api.get<{ name: string; email: string; address: string }>("/api/marketing/sender")).data;
}
export async function saveMarketingTemplate(input: Pick<CampaignInput, "contentBlocks" | "htmlContent" | "textContent"> & { name: string }) {
  return (await api.post<MarketingEmailTemplate>("/api/marketing/templates", input)).data;
}
