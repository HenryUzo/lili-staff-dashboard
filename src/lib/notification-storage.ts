import type { StaffNotificationStore } from "@/notifications/types";

const NOTIFICATION_STORE_KEY = "lilivet.staff.notifications";

const emptyStore: StaffNotificationStore = {
  notifications: [],
  seenAppointmentIds: [],
  seenNewPatientIds: []
};

function getNotificationStoreKey(scope?: string | null) {
  return scope ? `${NOTIFICATION_STORE_KEY}.${scope}` : NOTIFICATION_STORE_KEY;
}

export function createEmptyNotificationStore(): StaffNotificationStore {
  return {
    notifications: [],
    seenAppointmentIds: [],
    seenNewPatientIds: []
  };
}

export function getStoredNotificationStore(scope?: string | null): StaffNotificationStore {
  const raw = window.localStorage.getItem(getNotificationStoreKey(scope));

  if (!raw) {
    return createEmptyNotificationStore();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StaffNotificationStore>;

    return {
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      seenAppointmentIds: Array.isArray(parsed.seenAppointmentIds) ? parsed.seenAppointmentIds : [],
      seenNewPatientIds: Array.isArray(parsed.seenNewPatientIds) ? parsed.seenNewPatientIds : []
    };
  } catch {
    window.localStorage.removeItem(getNotificationStoreKey(scope));
    return createEmptyNotificationStore();
  }
}

export function setStoredNotificationStore(store: StaffNotificationStore, scope?: string | null) {
  window.localStorage.setItem(getNotificationStoreKey(scope), JSON.stringify(store));
}

export function clearStoredNotificationStore(scope?: string | null) {
  window.localStorage.removeItem(getNotificationStoreKey(scope));
}
