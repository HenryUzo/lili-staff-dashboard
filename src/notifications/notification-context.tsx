import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAppointmentRequests } from "@/api/appointments";
import { getNewPatientRequests } from "@/api/new-patients";
import { useAuth } from "@/auth/auth-context";
import {
  createEmptyNotificationStore,
  getStoredNotificationStore,
  setStoredNotificationStore
} from "@/lib/notification-storage";
import { formatRelativeTime, formatSpecies, formatVisitType } from "@/lib/format";
import type { AppointmentRequestListItem, NewPatientRequest } from "@/types/api";
import type { StaffNotification, StaffNotificationKind, StaffNotificationStore } from "@/notifications/types";

const POLL_INTERVAL_MS = 30_000;
const WATCH_LIMIT = 20;
const MAX_NOTIFICATIONS = 40;
const MAX_SEEN_IDS = 120;

interface NotificationContextValue {
  notifications: StaffNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (notificationId: string) => void;
  openNotification: (notification: StaffNotification) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function clampIds(ids: string[]) {
  return ids.slice(0, MAX_SEEN_IDS);
}

function mergeSeenIds(existing: string[], incoming: string[]) {
  return clampIds(Array.from(new Set([...incoming, ...existing])));
}

function mergeNotifications(
  existing: StaffNotification[],
  incoming: StaffNotification[]
): StaffNotification[] {
  return [...incoming, ...existing]
    .sort((left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime())
    .slice(0, MAX_NOTIFICATIONS);
}

function buildAppointmentNotification(item: AppointmentRequestListItem): StaffNotification {
  return {
    id: `appointment:${item.id}`,
    kind: "appointment",
    entityId: item.id,
    title: `New appointment request for ${item.pet.name}`,
    description: `${item.owner.firstName} ${item.owner.lastName} • ${formatVisitType(item.visitType)}`,
    route: `/appointments/${item.id}`,
    createdAt: item.createdAt,
    observedAt: new Date().toISOString(),
    read: false
  };
}

function buildNewPatientNotification(item: NewPatientRequest): StaffNotification {
  return {
    id: `new-patient:${item.id}`,
    kind: "new-patient",
    entityId: item.id,
    title: `New patient intake for ${item.petName}`,
    description: `${item.ownerFullName} • ${formatSpecies(item.species)}`,
    route: `/new-patients/${item.id}`,
    createdAt: item.createdAt,
    observedAt: new Date().toISOString(),
    read: false
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationScope = user?.id ?? null;
  const [store, setStore] = useState<StaffNotificationStore>(() => createEmptyNotificationStore());
  const bootstrappedRef = useRef<Record<StaffNotificationKind, boolean>>({
    appointment: false,
    "new-patient": false
  });

  useEffect(() => {
    bootstrappedRef.current = {
      appointment: false,
      "new-patient": false
    };

    if (!isAuthenticated || !notificationScope) {
      setStore(createEmptyNotificationStore());
      return;
    }

    setStore(getStoredNotificationStore(notificationScope));
  }, [isAuthenticated, notificationScope]);

  useEffect(() => {
    if (!isAuthenticated || !notificationScope) {
      return;
    }

    setStoredNotificationStore(store, notificationScope);
  }, [isAuthenticated, notificationScope, store]);

  const appointmentWatchQuery = useQuery({
    queryKey: ["notification-watch", "appointments"],
    queryFn: () => getAppointmentRequests({ limit: WATCH_LIMIT }),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true
  });

  const newPatientWatchQuery = useQuery({
    queryKey: ["notification-watch", "new-patients"],
    queryFn: () => getNewPatientRequests({ limit: WATCH_LIMIT }),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true
  });

  function showToast(notification: StaffNotification) {
    toast(notification.title, {
      id: notification.id,
      description: notification.description,
      action: {
        label: "Open",
        onClick: () => openNotification(notification)
      }
    });
  }

  function processIncomingItems<TItem extends { id: string }>(
    kind: StaffNotificationKind,
    items: TItem[],
    notificationBuilder: (item: TItem) => StaffNotification
  ) {
    if (!items.length) {
      bootstrappedRef.current[kind] = true;
      return;
    }

    const currentIds = items.map((item) => item.id);
    const notificationsToShow: StaffNotification[] = [];

    setStore((currentStore) => {
      const seenIds =
        kind === "appointment" ? currentStore.seenAppointmentIds : currentStore.seenNewPatientIds;
      const firstLoadWithoutHistory =
        !bootstrappedRef.current[kind] &&
        currentStore.notifications.length === 0 &&
        seenIds.length === 0;

      bootstrappedRef.current[kind] = true;

      if (firstLoadWithoutHistory) {
        return kind === "appointment"
          ? {
              ...currentStore,
              seenAppointmentIds: mergeSeenIds(seenIds, currentIds)
            }
          : {
              ...currentStore,
              seenNewPatientIds: mergeSeenIds(seenIds, currentIds)
            };
      }

      const knownIds = new Set(seenIds);

      for (const item of items) {
        if (knownIds.has(item.id)) {
          continue;
        }

        knownIds.add(item.id);
        notificationsToShow.push(notificationBuilder(item));
      }

      if (notificationsToShow.length === 0) {
        return kind === "appointment"
          ? {
              ...currentStore,
              seenAppointmentIds: mergeSeenIds(seenIds, currentIds)
            }
          : {
              ...currentStore,
              seenNewPatientIds: mergeSeenIds(seenIds, currentIds)
            };
      }

      const nextStore = {
        ...currentStore,
        notifications: mergeNotifications(currentStore.notifications, notificationsToShow)
      };

      return kind === "appointment"
        ? {
            ...nextStore,
            seenAppointmentIds: mergeSeenIds(seenIds, currentIds)
          }
        : {
            ...nextStore,
            seenNewPatientIds: mergeSeenIds(seenIds, currentIds)
          };
    });

    if (notificationsToShow.length > 0) {
      notificationsToShow.forEach(showToast);
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      if (kind === "appointment") {
        queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["new-patient-requests"] });
      }
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !appointmentWatchQuery.data) {
      return;
    }

    processIncomingItems(
      "appointment",
      appointmentWatchQuery.data.data,
      buildAppointmentNotification
    );
  }, [appointmentWatchQuery.data, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !newPatientWatchQuery.data) {
      return;
    }

    processIncomingItems(
      "new-patient",
      newPatientWatchQuery.data.data,
      buildNewPatientNotification
    );
  }, [isAuthenticated, newPatientWatchQuery.data]);

  function markAsRead(notificationId: string) {
    setStore((currentStore) => ({
      ...currentStore,
      notifications: currentStore.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    }));
  }

  function markAllRead() {
    setStore((currentStore) => ({
      ...currentStore,
      notifications: currentStore.notifications.map((notification) => ({
        ...notification,
        read: true
      }))
    }));
  }

  function openNotification(notification: StaffNotification) {
    markAsRead(notification.id);
    navigate(notification.route);
  }

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: store.notifications,
      unreadCount: store.notifications.filter((notification) => !notification.read).length,
      markAllRead,
      markAsRead,
      openNotification
    }),
    [store.notifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}

export function formatNotificationMeta(notification: StaffNotification) {
  return `${formatRelativeTime(notification.createdAt)} • ${
    notification.kind === "appointment" ? "Appointment request" : "New patient intake"
  }`;
}
