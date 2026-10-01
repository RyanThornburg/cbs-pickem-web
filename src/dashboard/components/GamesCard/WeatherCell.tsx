import dayjs from "dayjs";
import { Forecast, HourlyForecast, Stadium } from "../../types";
import {
  duringGameHours,
  merryskyUrl,
  PRECIP_TREND,
  weatherFlags,
  weatherTrends,
} from "./gamesCardUtils";
import {
  AlertFlagIcon,
  DomeIcon,
  ExternalLinkIcon,
  wxIcon,
  wxIconFor,
} from "./weatherIcons";

type Props = {
  forecast?: Forecast | null;
  stadium?: Stadium;
};

// Conditions on the left, hourly strip beside them on the right -- same on
// the desktop table (wide Weather column) and the mobile card (its own
// full-width row), so the strip never stacks under the text and doubles the
// row height.
export default function WeatherCell({ forecast, stadium }: Props) {
  const forecastUrl = merryskyUrl(stadium);

  if (!forecast) {
    // An open-air stadium only lacks a forecast when none was saved (weeks
    // from before forecasts were collected): say that, not "Open" next to a
    // dome icon, which reads as a roof type.
    // No link on "No forecast": the forecast site only has today's
    // forecast, which says nothing about a game that has no saved one.
    const openAir = stadium?.roof_type === "Open";
    if (openAir) {
      return <div className="gc-dome">No forecast</div>;
    }
    return (
      <div className="gc-dome">
        <DomeIcon />
        <ForecastLink url={forecastUrl}>
          {stadium?.roof_type === "Retractable"
            ? "Retractable roof"
            : (stadium?.roof_type ?? "Enclosed")}
          {forecastUrl && <ExternalLinkIcon />}
        </ForecastLink>
      </div>
    );
  }

  const flags = weatherFlags(forecast);
  const trends = weatherTrends(forecast);
  const hours = duringGameHours(forecast);

  return (
    <div className="gc-wx">
      <div className="gc-wxmain">
        {wxIcon(forecast.condition)}
        <div className="gc-wxtext">
          <ForecastLink url={forecastUrl}>
            <span className="gc-temp">
              {forecast.temp_f}°F
              {forecastUrl && <ExternalLinkIcon />}
            </span>
          </ForecastLink>
          <span className="gc-cond">
            {forecast.condition} · {forecast.wind_speed_mph}mph{" "}
            {forecast.wind_direction ?? ""}
          </span>
          {trends.map((trend) => (
            <span
              key={trend.label}
              className={`gc-trend${trend.worsening ? " worse" : ""}`}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.label}
            </span>
          ))}
        </div>
      </div>
      {hours.length > 0 && <HourlyStrip hours={hours} />}
      {/* Their own full-width line under the conditions and the strip, so a
          tag like "0.74mi Visibility" doesn't wrap in the narrow text column
          beside the strip on phones. */}
      {flags.length > 0 && (
        <div className="gc-flags">
          {flags.map((flag) => (
            <span key={flag.label} className={`gc-flag ${flag.tier}`}>
              {flag.tier === "danger" && <AlertFlagIcon />}
              {flag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Shown on every outdoor game once it's inside the hourly window (not just
// the ones with a trend note) -- a steady strip is itself the answer to
// "does this change during the game?".
function HourlyStrip({ hours }: { hours: HourlyForecast[] }) {
  const peak = Math.max(...hours.map((h) => h.precipitation_pct));
  const notable = (pct: number) => pct >= PRECIP_TREND.minNotablePct;

  return (
    <div className="gc-hours">
      {hours.map((h) => {
        const time = dayjs(h.time).format("hA");
        const isPeak =
          notable(h.precipitation_pct) && h.precipitation_pct === peak;
        return (
          <div
            key={h.time}
            className={`gc-hour${isPeak ? " peak" : ""}`}
            title={`${time}: ${h.condition}, ${h.temp_f}°F, ${h.precipitation_pct}% precip, gusts ${h.wind_gust_mph}mph`}
          >
            <span className="gc-hour-time">{time}</span>
            <span className="gc-sr">{h.condition}</span>
            {wxIconFor(h.icon, h.condition)}
            <span
              className={`gc-hour-pct${notable(h.precipitation_pct) ? " wet" : ""}`}
            >
              {h.precipitation_pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

type ForecastLinkProps = {
  url: string | null;
  children: React.ReactNode;
};

// Only the temperature (or the dome/roof label) links out, so a thumb
// scrolling past the weather block doesn't open Merry Sky by accident.
function ForecastLink({ url, children }: ForecastLinkProps) {
  if (!url) return <>{children}</>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="gc-wx-link"
      title="View forecast on Merry Sky"
    >
      {children}
    </a>
  );
}
