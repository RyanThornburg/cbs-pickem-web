import { pollAsync } from "../../api/pickemApi";
import { AdminStatus } from "../types";

// meta:admin is rewritten every orchestration tick (~1 min).
const POLL_INTERVAL_MS = 60_000;

// /api/admin/* sits behind Cloudflare Access. Without a valid Access session
// the request never reaches the Worker -- Access answers with a redirect to
// its Google login -- so `redirect: "manual"` keeps fetch from following that
// cross-origin hop. Anything but a 200 from the Worker itself means "not
// signed in as admin" (an opaque redirect, or the Worker's own 401).
const adminFetch = (path: string): Promise<Response> =>
  fetch(path, { redirect: "manual", cache: "no-store" });

export class AdminUnauthorizedError extends Error {}

// Whether the current browser has a valid admin session. Only decides whether
// the Admin tab is shown -- the Worker re-checks on every admin request.
export const GetIsAdmin = async (): Promise<boolean> => {
  try {
    const response = await adminFetch("/api/admin/me");
    return response.ok;
  } catch {
    return false;
  }
};

export const GetAdminStatus = (
  onData: (status: AdminStatus) => void,
  onError: (error: Error) => void
): (() => void) => {
  const load = async (): Promise<AdminStatus> => {
    const response = await adminFetch("/api/admin/status");
    if (response.type === "opaqueredirect" || response.status === 401) {
      throw new AdminUnauthorizedError("Admin session missing or expired");
    }
    if (!response.ok) {
      throw new Error(`/api/admin/status responded with ${response.status}`);
    }
    return (await response.json()) as AdminStatus;
  };

  const stop = pollAsync(load, POLL_INTERVAL_MS, onData, (error) => {
    // Polling can't fix an expired session -- stop until the page is
    // reloaded (which goes back through the Access login).
    if (error instanceof AdminUnauthorizedError) stop();
    onError(error);
  });
  return stop;
};
