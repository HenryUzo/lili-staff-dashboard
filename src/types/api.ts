export type StaffRole = "ADMIN" | "STAFF";
export type AppointmentRequestStatus =
  | "PENDING_REVIEW"
  | "CONFIRMED"
  | "OVERDUE"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";
export type CalendarSyncStatus = "NOT_SYNCED" | "SYNCED" | "FAILED";
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
