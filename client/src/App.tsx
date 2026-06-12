import { Route, Routes } from "react-router-dom";
import CommonLayout from "./components/common/layout";
import Support from "./pages/support";
import LandingPage from "./pages/landing";
import { AuthGate } from "./context/auth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<CommonLayout />}>
        <Route
          path="/support"
          element={
            <AuthGate>
              <Support />
            </AuthGate>
          }
        />
        <Route path="*" element={<div>Not found</div>} />
      </Route>
    </Routes>
  );
}
