// One way to say the weather on every tab: "68°F · Partly cloudy · Wind 5 mph
// SSW · Precip 0%". The feed's conditions are Title Case ("Mostly Cloudy");
// the app's tags and labels are sentence case, so they're lowered here.

export function conditionText(condition: string): string {
  const lower = condition.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function tempText(tempF: number): string {
  return `${Math.round(tempF)}°F`;
}

export function windText(mph: number, direction?: string | null): string {
  return `Wind ${Math.round(mph)} mph${direction ? ` ${direction}` : ""}`;
}

export function precipText(pct: number): string {
  return `Precip ${Math.round(pct)}%`;
}

type Conditions = {
  temp_f?: number | null;
  condition?: string | null;
  wind_speed_mph?: number | null;
  wind_direction?: string | null;
  precipitation_pct?: number | null;
};

type LineOptions = { temp?: boolean; precip?: boolean };

// The full line, skipping any part the feed left out.
export function weatherLine(w: Conditions, options?: LineOptions): string {
  return weatherParts(w, options).join(" · ");
}

// The same parts, for a layout that keeps each one from breaking inside.
export function weatherParts(
  w: Conditions,
  { temp = true, precip = true }: LineOptions = {}
): string[] {
  const parts: string[] = [];
  if (temp && w.temp_f != null) parts.push(tempText(w.temp_f));
  if (w.condition) parts.push(conditionText(w.condition));
  if (w.wind_speed_mph != null)
    parts.push(windText(w.wind_speed_mph, w.wind_direction));
  if (precip && w.precipitation_pct != null)
    parts.push(precipText(w.precipitation_pct));
  return parts;
}

// An indoor game's line in place of weather: "Dome", "Retractable roof".
// Retractable roofs read as closed, since the feed can't tell open from shut.
export function roofText(roofType: string | null | undefined): string {
  if (roofType === "Retractable") return "Retractable roof";
  return roofType || "Enclosed";
}
