import ScalekitClient, { AuthenticationResponse } from "@scalekit-sdk/node";
import { Router } from "express";
import crypto from "crypto";
import { clearSessionCookie, setSessionCookie } from "./cookie";
import { requireAuth } from "./auth.middleware";

const router = Router();

function extractEnv(key: string) {
  const getVal = process.env[key];

  if (!getVal) throw new Error(`Missing env, ${getVal}`);

  return getVal;
}

function makeScalekit() {
  return new ScalekitClient(
    extractEnv("SCALEKIT_ENVIRONMENT_URL"),
    extractEnv("SCALEKIT_CLIENT_ID"),
    extractEnv("SCALEKIT_CLIENT_SECRET"),
  );
}

function getQueryString(value: unknown) {
  if (typeof value === "string") return value;
  return undefined;
}

function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: 20 * 60 * 1000,
  };
}

router.get("/login", (req, res) => {
  try {
    const scalekit = makeScalekit();

    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("sp_oauth_state", state, stateCookieOptions());

    const redirectUri = `${extractEnv("BACKEND_URL")}/auth/callback`;
    const authorizationUrl = scalekit.getAuthorizationUrl(redirectUri, {
      scopes: ["openid", "profile", "email"],
      state,
      prompt: "login",
    });

    res.redirect(authorizationUrl);
  } catch (e) {
    console.error("Scalekit login error:", e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const code = getQueryString(req.query.code);
    const state = getQueryString(req.query.state);
    const error = getQueryString(req.query.error);

    if (error) {
      return res.redirect(
        `${extractEnv("FRONTEND_URL")}/login=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !state) {
      return res.status(400).send("Missing code/state");
    }

    const expectedState = req.cookies?.["sp_oauth_state"];
    if (!expectedState || expectedState !== state) {
      return res.status(400).send("Invalid state!!!");
    }

    res.clearCookie("sp_oauth_state", stateCookieOptions());

    const scalekit = makeScalekit();
    const redirectUri = `${extractEnv("BACKEND_URL")}/auth/callback`;

    const authResult: AuthenticationResponse =
      await scalekit.authenticateWithCode(code, redirectUri);

    if (!authResult.user) {
      return res.status(500).send("user info is missing");
    }

    setSessionCookie(res, {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { background: #0A0A0F; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3 style="color:#a78bfa; margin-bottom:8px;">Authentication Complete</h3>
            <p style="color:#94a3b8; font-size:14px;">Connecting to your workspace...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: "SCALEKIT_AUTH_SUCCESS" }, "*");
                setTimeout(() => window.close(), 100);
              } else {
                window.location.href = "${extractEnv("FRONTEND_URL")}/support";
              }
            } catch(e) {
              window.location.href = "${extractEnv("FRONTEND_URL")}/support";
            }
          </script>
        </body>
      </html>
    `);
  } catch (e) {
    console.error("Scalekit callback error:", e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
    },
  });
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);

  res.json({ ok: true });
});

export default router;
