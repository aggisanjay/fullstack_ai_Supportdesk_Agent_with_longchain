import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import CommonLayout from "./components/common/layout";
import Support from "./pages/support";
import OverviewPage from "./features/support/pages/OverviewPage";
import TicketsPage from "./features/support/pages/TicketsPage";
import KnowledgePage from "./features/support/pages/KnowledgePage";
import AnalyticsPage from "./features/support/pages/AnalyticsPage";
import DiagnosticsPage from "./features/support/pages/DiagnosticsPage";
import LandingPage from "./pages/landing";
import Login from "./pages/login";
import { AuthGate, useAuth } from "./context/auth";
import AppLoadingScreen from "./components/common/AppLoadingScreen";

export default function App() {
  const { loading } = useAuth();
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  return (
    <>
      {showInitialLoader && (
        <AppLoadingScreen
          isLoading={loading}
          minDuration={1100}
          onFinished={() => setShowInitialLoader(false)}
        />
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route element={<CommonLayout />}>
          <Route
            path="/support"
            element={
              <AuthGate>
                <Support />
              </AuthGate>
            }
          >
            <Route path="overview" element={<OverviewPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/:ticketId" element={<TicketsPage />} />
            <Route path="kb" element={<KnowledgePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="diagnostics" element={<DiagnosticsPage />} />
          </Route>
          <Route path="*" element={<div>Not found</div>} />
        </Route>
      </Routes>
    </>
  );
}
