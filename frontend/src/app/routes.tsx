import { createBrowserRouter } from "react-router";
import { OverviewPage } from "./pages/OverviewPage";
import { LedgerPage } from "./pages/LedgerPage";
import { AgentsPage } from "./pages/AgentsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ShieldPage } from "./pages/ShieldPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import AuthPage from "./pages/auth/AuthPage";

import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        Component: OverviewPage,
      },
      {
        path: "/agents",
        Component: AgentsPage,
      },
      {
        path: "/ledger",
        Component: LedgerPage,
      },
      {
        path: "/shield",
        Component: ShieldPage,
      },
      {
        path: "/policies",
        Component: PoliciesPage,
      },
      {
        path: "/onboarding",
        Component: OnboardingPage,
      },
      {
        path: "/settings",
        Component: SettingsPage,
      },
    ],
  },
]);