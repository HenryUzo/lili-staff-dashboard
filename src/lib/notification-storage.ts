import type { StaffNotificationStore } from "@/notifications/types";

const NOTIFICATION_STORE_KEY = "lilivet.staff.notifications";

const emptyStore: StaffNotificationStore = {
  notifications: [],
  seenAppointmentIds: [],
  seenNewPatientIds: []
};

export function getStoredNotificationStore(): StaffNotificationStore {
  const raw = window.localStorage.getItem(NOTIFICATION_STORE_KEY);

  if (!raw) {
    return emptyStore;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StaffNotificationStore>;

    return {
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      seenAppointmentIds: Array.isArray(parsed.seenAppointmentIds) ? parsed.seenAppointmentIds : [],
      seenNewPatientIds: Array.isArray(parsed.seenNewPatientIds) ? parsed.seenNewPatientIds : []
    };
  } catch {
    window.localStorage.removeItem(NOTIFICATION_STORE_KEY);
    return emptyStore;
  }
}

export function setStoredNotificationStore(store: StaffNotificationStore) {
  window.localStorage.setItem(NOTIFICATION_STORE_KEY, JSON.stringify(store));
}

export function clearStoredNotificationStore() {
  window.localStorage.removeItem(NOTIFICATION_STORE_KEY);
}
