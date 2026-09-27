import dayjs from "dayjs";
import { Forecast, HourlyForecast, Stadium } from "../../types";
import {
  duringGameHours,
  merryskyUrl,
  PRECIP_TREND,
  weatherFlags,
  weatherTrends,
} from "./gamesCardUtils";
import { AlertFlagIcon, DomeIcon, ExternalLinkIcon, wxIcon, wxIconFor } from "./weatherIcons";

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
    return (
      <ForecastLink url={forecastUrl} className="gc-dome">
        <DomeIcon />
        {stadium?.roof_type ?? "Enclosed"}
        {forecastUrl && <ExternalLinkIcon />}
      </ForecastLink>
    );
  }

  const flags = weatherFlags(forecast);
  const trends = weatherTrends(forecast);
  const hours = duringGameHours(forecast);

  return (
    <ForecastLink url={forecastUrl} className="gc-wx">
      <div className="gc-wxmain">
        {wxIcon(forecast.condition)}
        <div className="gc-wxtext">
          <span className="gc-temp">
            {forecast.temp_f}°F
            {forecastUrl && <ExternalLinkIcon />}
          </span>
          <span className="gc-cond">
            {forecast.condition} · {forecast.wind_speed_mph}mph {forecast.wind_direction ?? ""}
          </span>
          {trends.map((trend) => (
            <span key={trend.label} className={`gc-trend${trend.worsening ? " worse" : ""}`}>
              {trend.direction === "up" ? "↑" : "↓"} {trend.label}
            </span>
          ))}
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
      </div>
      {hours.length > 0 && <HourlyStrip hours={hours} />}
    </ForecastLink>
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
        const isPeak = notable(h.precipitation_pct) && h.precipitation_pct === peak;
        return (
          <div
            key={h.time}
            className={`gc-hour${isPeak ? " peak" : ""}`}
            title={`${time}: ${h.condition}, ${h.temp_f}°F, ${h.precipitation_pct}% precip, gusts ${h.wind_gust_mph}mph`}
          >
            <span className="gc-hour-time">{time}</span>
            {wxIconFor(h.icon, h.condition)}
            <span className={`gc-hour-pct${notable(h.precipitation_pct) ? " wet" : ""}`}>
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
  className: string;
  children: React.ReactNode;
};

function ForecastLink({ url, className, children }: ForecastLinkProps) {
  if (!url) {
    return <div className={className}>{children}</div>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} gc-wx-link`}
      title="View forecast on Merry Sky"
    >
      {children}
    </a>
  );
}
