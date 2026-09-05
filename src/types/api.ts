export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";
export type PermissionKey =
  | "APPOINTMENTS_VIEW"
  | "APPOINTMENTS_MANAGE"
  | "NEW_PATIENTS_VIEW"
  | "PET_CARE_VIEW"
  | "PET_CARE_EDIT"
  | "PET_CARE_PUBLISH"
  | "PET_CARE_REVIEWERS"
  | "CLIENTS_VIEW"
  | "CLIENTS_MANAGE"
  | "CAMPAIGNS_VIEW"
  | "CAMPAIGNS_MANAGE";

export type MarketingCampaignStatus = "DRAFT" | "READY_TO_SEND" | "SENDING" | "SENT" | "FAILED";
export type MarketingContentBlockType = "TITLE" | "TEXT" | "IMAGE" | "BUTTON" | "DIVIDER" | "LOGO" | "SOCIAL" | "SPACER";
export interface MarketingContentBlock { id: string; type: MarketingContentBlockType; text?: string; url?: string; alt?: string; align?: "left" | "center" | "right"; }
export interface MarketingEmailTemplate { id: string; name: string; contentBlocks: MarketingContentBlock[]; htmlContent?: string; textContent?: string; }
export interface MarketingCampaign {
  id: string;
  name: string;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  textContent: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  audienceMode: "CONSENTED_CLIENTS" | "SELECTED_EMAILS";
  customAudience: string[] | null;
  contentBlocks: MarketingContentBlock[] | null;
  templateId: string | null;
  recipientSelectionConfirmed: boolean;
  designConfigured: boolean;
  status: MarketingCampaignStatus;
  audienceCount: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { deliveries: number };
}
export type PetCarePublishingStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export type PetCareReviewStatus = "NOT_REVIEWED" | "IN_REVIEW" | "MEDICALLY_REVIEWED";

export interface PetCareReviewer {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  credentials: string;
  role: string;
  photoUrl: string | null;
  shortBio: string;
  isActive: boolean;
}

export type PetCareReviewerInput = Omit<PetCareReviewer, "id">;

export interface PetCareArticleSection {
  id: string;
  title: string;
  type?: "CONTENT" | "IMAGE";
  content: string[];
  bullets?: string[];
  imageUrl?: string | null;
  imageAlt?: string | null;
  caption?: string | null;
}

export interface PetCareArticle {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  summary: string;
  categorySlug: string;
  categoryLabel: string;
  tags: string[];
  heroImageUrl: string | null;
  heroImageKey: string | null;
  heroImageFile: string | null;
  heroImageAlt: string;
  authorName: string;
  authorRole: string;
  reviewerId: string | null;
  reviewer: PetCareReviewer | null;
  status: PetCarePublishingStatus;
  reviewStatus: PetCareReviewStatus;
  reviewedAt: string | null;
  reviewDueAt: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number;
  relatedService: { title: string; path: string };
  relatedArticleSlugs: string[];
  featured: boolean;
  seasonal: boolean;
  popular: boolean;
  keyTakeaways: string[];
  monitorAtHome: string[];
  warningCallout: string | null;
  vetQuote: string | null;
  faqs: Array<{ question: string; answer: string }>;
  references: Array<{ label: string; url?: string }>;
  sections: PetCareArticleSection[];
  previewShares: PetCarePreviewShare[];
  createdAt: string;
  updatedAt: string;
}

export interface PetCarePreviewComment {
  id: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface PetCarePreviewShare {
  id: string;
  shareType: "COMMENT" | "REVIEWER";
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  invitationRecipient: string | null;
  invitationSentAt: string | null;
  comments: PetCarePreviewComment[];
}

export type PetCareArticleInput = Omit<
  PetCareArticle,
  "id" | "reviewer" | "previewShares" | "status" | "reviewStatus" | "reviewedAt" | "publishedAt" | "createdAt" | "updatedAt"
>;
export type AppointmentRequestStatus =
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "OVERDUE"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";
export type CalendarSyncStatus = "NOT_SYNCED" | "SYNCED" | "FAILED";
export type NewPatientReferralSource =
  | "PET_PARADISE"
  | "WEBSITE"
  | "GOOGLE"
  | "PET_BARN"
  | "WELCOME_HOME_MAGAZINE"
  | "REFERRED_BY_ANOTHER_VETERINARIAN"
  | "REFERRED_BY_FRIEND_OR_FAMILY_MEMBER"
  | "OTHER";
export type VisitType =
  | "URGENT_CARE"
  | "WELLNESS_EXAM"
  | "VACCINATIONS"
  | "DENTAL_CARE"
  | "SURGERY"
  | "DIAGNOSTICS"
  | "NEW_PATIENT_VISIT"
  | "OTHER";
export type PetSpecies = "DOG" | "CAT" | "UNKNOWN";
export type PetSex = "MALE" | "FEMALE";

export interface StaffUser {
  id: string;
  email: string;
  role: StaffRole;
  permissions: PermissionKey[];
}

export interface ManagedStaffUser extends StaffUser {
  isActive: boolean;
  invitationStatus: "ACCEPTED" | "PENDING" | "NONE";
  invitationExpiresAt: string | null;
  invitationAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSession {
  user: StaffUser;
}

export type StaffLoginResult = StaffSession | { mfaRequired: true; challengeToken: string } | { mfaEnrollmentRequired: true; setupToken: string };
export interface StaffMfaSetup {
  secret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
}
export interface StaffMfaEnrollmentResult {
  session: StaffSession;
  recoveryCodes: string[];
}

export type MarketingConsentStatus = "NOT_SUBSCRIBED" | "SUBSCRIBED" | "UNSUBSCRIBED" | "SUPPRESSED";
export interface ClientProfile {
  emailMarketingStatus: MarketingConsentStatus;
  smsMarketingStatus: MarketingConsentStatus;
  emailConsentAt: string | null;
  smsConsentAt: string | null;
  emailConsentSource: string | null;
  smsConsentSource: string | null;
}
export interface ClientLifecycleRecord {
  id: string;
  petId?: string;
  pet?: { id: string; name: string; species: PetSpecies };
  newClientDate: string;
  leadSource: string | null;
  referredBy: string | null;
  regularVeterinarian: string | null;
  firstVisitType: string | null;
  doctorSeen: string | null;
  recheckRecommended: boolean;
  recheckScheduled: boolean;
  recheckDate: string | null;
  recheckCompleted: boolean;
  followUpNeeded: boolean;
  firstVisitRevenue: string | null;
  additionalServicesRevenue: string | null;
  wellnessPlan: string | null;
  clientStatus: "ACTIVE" | "INACTIVE" | "DECEASED";
  lastVisitAt: string | null;
  nextAppointmentAt: string | null;
  notes: string | null;
}
export interface ClientDirectoryItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  pets: Array<{ id: string; name: string; species: PetSpecies }>;
  clientProfile: ClientProfile | null;
  clientLifecycleRecords: ClientLifecycleRecord[];
  createdAt: string;
  updatedAt: string;
}
export interface ClientDetail extends Omit<ClientDirectoryItem, "clientLifecycleRecords"> {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  contactMethods: Array<{ id: string; channel: "PHONE" | "EMAIL"; label: string | null; value: string; isPrimary: boolean; source: "WEAVE" | "LILI_WEB" | "MANUAL" | null }>;
  externalClientRecords: Array<{ id: string; source: "WEAVE" | "LILI_WEB" | "MANUAL"; externalContactId: string | null; externalPetId: string | null; contactStatus: string | null; lastSyncedAt: string }>;
  clientLifecycleRecords: Array<ClientLifecycleRecord & { pet: { id: string; name: string; species: PetSpecies; breed: string | null; sex: "MALE" | "FEMALE" | "UNKNOWN"; age: string | null; spayedNeutered: boolean | null } }>;
}
export interface ClientImportRun {
  id: string;
  originalFileName: string;
  sourceLabel: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  skippedRows: Array<{ row: number; reason: string }> | null;
  createdAt: string;
  initiatedBy: { email: string } | null;
}

export interface ApiErrorPayload {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
}

export interface UploadedFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  publicUrl: string | null;
  attachmentStatus: string;
  expiresAt: string | null;
  appointmentDraftId: string | null;
  appointmentRequestId: string | null;
  newPatientRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  preferredContactMethod?: string | null;
}

export interface AppointmentPetSummary {
  id: string;
  ownerId?: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  approximateAgeYears?: number | null;
  age?: string | null;
  sex?: PetSex;
  weightLbs?: string | null;
  spayedNeutered?: boolean | null;
  currentMedications?: string | null;
  existingConditions?: string | null;
}

export interface AppointmentPreferredSelection {
  date: string;
  timeSlots: string[];
}

export interface AppointmentRequestListItem {
  id: string;
  status: AppointmentRequestStatus;
  visitType: VisitType;
  timezone: string | null;
  confirmedStartAt: string | null;
  confirmedEndAt: string | null;
  confirmedTimezone: string | null;
  rescheduleRequestedAt: string | null;
  rescheduleResponseDeadline: string | null;
  rescheduleEmailSentAt: string | null;
  rescheduleTokenIssuedAt: string | null;
  rescheduledFromAppointmentRequestId: string | null;
  replacementAppointmentRequestId: string | null;
  calendarEventId: string | null;
  calendarEventUrl: string | null;
  calendarSyncStatus: CalendarSyncStatus;
  calendarSyncedAt: string | null;
  calendarSyncError: string | null;
  preferredSelections: AppointmentPreferredSelection[];
  possibleDuplicate: boolean;
  duplicateOfId: string | null;
  owner: AppointmentOwner;
  pet: AppointmentPetSummary;
  files?: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequestDetail extends AppointmentRequestListItem {
  symptomsOrConcerns: string | null;
  currentMedications: string | null;
  previousVeterinarian: string | null;
  symptomDuration: string | null;
  confirmedByStaffUserId: string | null;
  files: UploadedFile[];
  draft: {
    id: string;
    sessionToken: string;
    submittedAt: string | null;
  } | null;
  replacementAppointmentRequest?: {
    id: string;
    status: AppointmentRequestStatus;
    createdAt: string;
  } | null;
}

export interface NewPatientRequest {
  id: string;
  ownerFullName: string;
  ownerEmail: string | null;
  ownerPhoneNumber: string;
  petName: string;
  species: PetSpecies;
  breed: string | null;
  age: string | null;
  sex: PetSex;
  weightLbs: string | null;
  spayedNeutered: boolean | null;
  currentMedications: string | null;
  existingConditions: string | null;
  reasonForVisit: string;
  isUrgent: boolean;
  preferredDateTime: string | null;
  timezone: string | null;
  previousVetClinic: string | null;
  consentToElectronicComms: boolean;
  referralSource: NewPatientReferralSource | null;
  referralSourceOther: string | null;
  referralSourceCapturedAt: string | null;
  ownerId: string | null;
  petId: string | null;
  possibleDuplicate: boolean;
  duplicateOfId: string | null;
  files: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface CursorListResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface AppointmentListFilters {
  search?: string;
  status?: AppointmentRequestStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface NewPatientListFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  referralSource?: NewPatientReferralSource | "NOT_CAPTURED" | "ALL";
}

export interface RawAppointmentPreferredSelection {
  date: string;
  timeSlots: string[];
}

export interface RawAppointmentBase {
  id: string;
  status: AppointmentRequestStatus;
  visitType: VisitType;
  timezone: string | null;
  confirmedStartAt: string | null;
  confirmedEndAt: string | null;
  confirmedTimezone: string | null;
  rescheduleRequestedAt: string | null;
  rescheduleResponseDeadline: string | null;
  rescheduleEmailSentAt: string | null;
  rescheduleTokenIssuedAt: string | null;
  rescheduledFromAppointmentRequestId: string | null;
  replacementAppointmentRequestId: string | null;
  confirmedByStaffUserId?: string | null;
  calendarEventId: string | null;
  calendarEventUrl: string | null;
  calendarSyncStatus: CalendarSyncStatus;
  calendarSyncedAt: string | null;
  calendarSyncError: string | null;
  preferredSelections?: RawAppointmentPreferredSelection[] | null;
  preferredSlots?: string[] | null;
  possibleDuplicate: boolean;
  duplicateOfId: string | null;
  owner: AppointmentOwner;
  pet: AppointmentPetSummary;
  files?: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface RawAppointmentDetail extends RawAppointmentBase {
  symptomsOrConcerns: string | null;
  currentMedications: string | null;
  previousVeterinarian: string | null;
  symptomDuration: string | null;
  draft: {
    id: string;
    sessionToken: string;
    submittedAt: string | null;
  } | null;
  replacementAppointmentRequest?: {
    id: string;
    status: AppointmentRequestStatus;
    createdAt: string;
  } | null;
}
