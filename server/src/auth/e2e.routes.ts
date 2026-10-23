import { Router } from "express";
import { clearSessionCookie, setSessionCookie } from "./cookie";

const router = Router();

function checkE2EMode() {
  const isProd = process.env.NODE_ENV === "production";
  const enabled = process.env.E2E_TEST_MODE === "true";

  if (isProd || !enabled) return false;

  return true;
}

router.post("/e2e/login", (req, res) => {
  if (!checkE2EMode()) {
    return res.status(404).json({ error: "Not found" });
  }

  const email =
    typeof req.body?.email === "string" && req.body.email.trim()
      ? req.body.email.trim()
      : "e2e@test.local";

  const name =
    typeof req.body?.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : "E2E Lead Support";

  const id =
    typeof req.body?.id === "string" && req.body.id.trim()
      ? req.body.id.trim()
      : "usr_" + Math.random().toString(36).substring(2, 9);

  setSessionCookie(res, { id, email, name });

  return res.json({ ok: true, user: { id, email, name } });
});

router.post("/e2e/logout", (req, res) => {
  if (!checkE2EMode()) {
    return res.status(404).json({ error: "Not found" });
  }

  clearSessionCookie(res);

  return res.json({ ok: true });
});

export default router;
