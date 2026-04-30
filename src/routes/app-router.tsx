import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/dashboard/app-shell";
import { LoginPage } from "@/pages/login-page";
import { NewPatientRequestsPage } from "@/pages/new-patient-requests-page";
import { OverviewPage } from "@/pages/overview-page";
import { AppointmentRequestsPage } from "@/pages/appointment-requests-page";
import { ProtectedRoute } from "@/routes/protected-route";

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <OverviewPage />
          },
          {
            path: "appointments",
            element: <AppointmentRequestsPage />
          },
          {
            path: "appointments/:appointmentId",
            element: <AppointmentRequestsPage />
          },
          {
            path: "new-patients",
            element: <NewPatientRequestsPage />
          },
          {
            path: "new-patients/:requestId",
            element: <NewPatientRequestsPage />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
