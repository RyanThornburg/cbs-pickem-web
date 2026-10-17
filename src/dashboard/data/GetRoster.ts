import { Roster, RosterPayment } from "../types";
import { adminFetch, AdminUnauthorizedError } from "./GetAdminStatus";

// Admin › Roster. One-shot fetches, not a poll: only the admin changes the
// payments, and every save answers with the whole updated roster. The
// names and emails behind it change about once a season.

export class RosterNotReadyError extends Error {}

const rosterPath = (season: number) => `/api/admin/roster/${season}`;

const readRoster = async (response: Response): Promise<Roster> => {
  if (response.type === "opaqueredirect" || response.status === 401) {
    throw new AdminUnauthorizedError("Admin session missing or expired");
  }
  if (!response.ok) {
    let reason = `responded with ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) reason = body.error;
    } catch {
      // Not JSON: keep the status.
    }
    throw new Error(reason);
  }
  return (await response.json()) as Roster;
};

export const GetRoster = async (season: number): Promise<Roster> => {
  const response = await adminFetch(rosterPath(season));
  // The list needs admin:users, which the pipeline writes.
  if (response.status === 404) {
    throw new RosterNotReadyError("No member list from the pipeline yet");
  }
  return readRoster(response);
};

// Saves one member's payment, or clears it with null (back to "no record",
// which the season close-out keeps as unknown rather than $0).
export const SavePayment = async (
  season: number,
  userId: number,
  payment: RosterPayment | null
): Promise<Roster> =>
  readRoster(
    await adminFetch(
      `${rosterPath(season)}/${userId}`,
      payment
        ? {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payment),
          }
        : { method: "DELETE" }
    )
  );
