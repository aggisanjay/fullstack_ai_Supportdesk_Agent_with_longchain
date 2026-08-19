import { apiGet, apiPost, BACKEND_URL } from "@/lib/api";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type User = {
  id: string;
  email: string;
  name?: string;
};

type MeResponse = {
  user: User;
};

type AuthContextVal = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithPopup: (onSuccess?: () => void) => void;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextVal | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    const res = await apiGet<MeResponse>("/auth/me");

    if (res.ok) {
      setUser(res.data.user);
    } else {
      setUser(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  async function logout() {
    await apiPost("/auth/logout");
    setUser(null);
  }

  function loginWithPopup(onSuccess?: () => void) {
    const width = 520;
    const height = 660;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${BACKEND_URL}/auth/login`,
      "ScalekitAuthModal",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "SCALEKIT_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        await fetchUser();
        if (onSuccess) onSuccess();
      }
    };

    window.addEventListener("message", handleMessage);

    const interval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(interval);
        window.removeEventListener("message", handleMessage);
        fetchUser().then(() => {
          if (onSuccess) onSuccess();
        });
      }
    }, 1000);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginWithPopup, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contextVal = useContext(AuthContext);

  if (!contextVal) throw new Error("useauth must be used inside provider");

  return contextVal;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, navigate, user, location.pathname]);

  if (loading) return <div>Checking session...</div>;
  if (!user) return null;

  return <>{children}</>;
}
