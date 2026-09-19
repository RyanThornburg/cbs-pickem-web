export const ClearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
  </svg>
);

export const CloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 18h10.5a3.5 3.5 0 0 0 .5-6.96A5.5 5.5 0 0 0 7.6 9.2 4.5 4.5 0 0 0 7 18Z" />
  </svg>
);

export const RainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 15.5h10a3.5 3.5 0 0 0 .5-6.96A5.5 5.5 0 0 0 7.1 6.7 4.5 4.5 0 0 0 6.5 15.5Z" />
    <path d="M8 19v1.6M12 19v1.6M16 19v1.6" />
  </svg>
);

export const DomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 19h18" />
    <path d="M4.5 19a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const ExternalLinkIcon = () => (
  <svg className="gc-linkicon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
);

export const AlertFlagIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 1 21h22L12 2Zm0 6.2 6.6 11.3H5.4L12 8.2ZM11 11h2v5h-2zM11 17h2v2h-2z" />
  </svg>
);

export const wxIcon = (cond?: string) => {
  if (!cond) return <CloudIcon />;
  const c = cond.toLowerCase();
  if (c.includes("clear")) return <ClearIcon />;
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower") || c.includes("snow")) {
    return <RainIcon />;
  }
  return <CloudIcon />;
};
