import { Forecast, Stadium } from "../../types";
import { merryskyUrl, weatherFlags } from "./gamesCardUtils";
import { AlertFlagIcon, DomeIcon, ExternalLinkIcon, wxIcon } from "./weatherIcons";

type Props = {
  forecast?: Forecast | null;
  stadium?: Stadium;
};

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

  return (
    <ForecastLink url={forecastUrl} className="gc-wx">
      {wxIcon(forecast.condition)}
      <div className="gc-wxtext">
        <span className="gc-temp">
          {forecast.temp_f}°F
          {forecastUrl && <ExternalLinkIcon />}
        </span>
        <span className="gc-cond">
          {forecast.condition} · {forecast.wind_speed_mph}mph {forecast.wind_direction ?? ""}
        </span>
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
    </ForecastLink>
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
