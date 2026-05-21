export type StaffNotificationKind = "appointment" | "new-patient";

export interface StaffNotification {
  id: string;
  kind: StaffNotificationKind;
  entityId: string;
  title: string;
  description: string;
  route: string;
  createdAt: string;
  observedAt: string;
  read: boolean;
}

export interface StaffNotificationStore {
  notifications: StaffNotification[];
  seenAppointmentIds: string[];
  seenNewPatientIds: string[];
}
