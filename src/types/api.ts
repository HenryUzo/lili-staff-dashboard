export type StaffRole = "ADMIN" | "STAFF";
export type PetCarePublishingStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export type PetCareReviewStatus = "NOT_REVIEWED" | "IN_REVIEW" | "MEDICALLY_REVIEWED";

export interface PetCareReviewer {
  id: string;
  slug: string;
  name: string;
  credentials: string;
  role: string;
  photoUrl: string | null;
  shortBio: string;
  isActive: boolean;
}

export interface PetCareArticleSection {
  id: string;
  title: string;
  content: string[];
  bullets?: string[];
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
export type PetSpecies = "DOG" | "CAT";
export type PetSex = "MALE" | "FEMALE";

export interface StaffUser {
  id: string;
  email: string;
  role: StaffRole;
}

export interface StaffSession {
  token: string;
  user: StaffUser;
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
