import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/dashboard/app-shell";
import { LoginPage } from "@/pages/login-page";
import { NewPatientRequestsPage } from "@/pages/new-patient-requests-page";
import { OverviewPage } from "@/pages/overview-page";
import { AppointmentRequestsPage } from "@/pages/appointment-requests-page";
import { PhotoshootGuidelinesPage } from "@/pages/photoshoot-guidelines-page";
import { PetCareArticlesPage } from "@/pages/pet-care-articles-page";
import { PetCareReviewersPage } from "@/pages/pet-care-reviewers-page";
import { TeamAccessPage } from "@/pages/team-access-page";
import { ForbiddenPage } from "@/pages/forbidden-page";
import { AcceptStaffInvitationPage } from "@/pages/accept-staff-invitation-page";
import { DashboardHomePage } from "@/pages/dashboard-home-page";
import { ClientsPage } from "@/pages/clients-page";
import { ClientDetailPage } from "@/pages/client-detail-page";
import { MarketingCampaignWorkspacePage } from "@/pages/marketing-campaign-workspace-page";
import { MarketingCampaignsLandingPage } from "@/pages/marketing-campaigns-landing-page";
import { ProtectedRoute } from "@/routes/protected-route";
import { PermissionRoute } from "@/routes/permission-route";

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/accept-invitation",
    element: <AcceptStaffInvitationPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardHomePage />
          },
          {
            path: "overview",
            element: <PermissionRoute superAdminOnly />,
            children: [{ index: true, element: <OverviewPage /> }]
          },
          {
            element: <PermissionRoute permission="APPOINTMENTS_VIEW" />,
            children: [
              { path: "appointments", element: <AppointmentRequestsPage /> },
              { path: "appointments/:appointmentId", element: <AppointmentRequestsPage /> }
            ]
          },
          {
            element: <PermissionRoute permission="NEW_PATIENTS_VIEW" />,
            children: [
              { path: "new-patients", element: <NewPatientRequestsPage /> },
              { path: "new-patients/:requestId", element: <NewPatientRequestsPage /> }
            ]
          },
          {
            element: <PermissionRoute permission="CLIENTS_VIEW" />,
            children: [{ path: "clients", element: <ClientsPage /> }, { path: "clients/:ownerId", element: <ClientDetailPage /> }]
          },
          {
            element: <PermissionRoute permission="PET_CARE_VIEW" />,
            children: [
              { path: "pet-care", element: <PetCareArticlesPage /> },
              { path: "pet-care/new", element: <PetCareArticlesPage /> },
              { path: "pet-care/:articleId", element: <PetCareArticlesPage /> }
            ]
          },
          {
            element: <PermissionRoute permission="PET_CARE_REVIEWERS" />,
            children: [{ path: "pet-care/reviewers", element: <PetCareReviewersPage /> }]
          },
          {
            element: <PermissionRoute superAdminOnly />,
            children: [{ path: "team", element: <TeamAccessPage /> }]
          },
          {
            element: <PermissionRoute superAdminOnly />,
            children: [
              { path: "campaigns", element: <MarketingCampaignsLandingPage /> },
              { path: "campaigns/new", element: <MarketingCampaignWorkspacePage /> },
              { path: "campaigns/:campaignId", element: <MarketingCampaignWorkspacePage /> }
            ]
          },
          {
            path: "forbidden",
            element: <ForbiddenPage />
          },
          {
            path: "brand-guide/photoshoot-guidelines",
            element: <PhotoshootGuidelinesPage />
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
