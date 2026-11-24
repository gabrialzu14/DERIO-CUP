import type { SVGProps } from "react";

const PATHS = {
  home: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-7.5Z",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8.4 15.42 10.89 14.12 14.91 9.88 14.91 8.58 10.89ZM12 8.4L12 3.4M15.42 10.89L20.18 9.34M14.12 14.91L17.05 18.96M9.88 14.91L6.95 18.96M8.58 10.89L3.82 9.34",
  table: "M4 6h16M4 12h16M4 18h10",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4.5v1.5A3.5 3.5 0 0 0 8 11m8-5h3.5v1.5A3.5 3.5 0 0 1 16 11m-4 4v4m-3.5 1h7",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  close: "m6 6 12 12M18 6 6 18",
  chevron: "m9 6 6 6-6 6",
  back: "m15 6-6 6 6 6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  pin: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8.5h.01",
  coffee: "M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 1h1.5a2.5 2.5 0 0 1 0 5H16M7 3v2m4-2v2m4-2v2M4 21h14",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10Zm7 4v3",
  switch: "M4 8h14m-4-4 4 4-4 4M20 16H6m4-4-4 4 4 4",
  refresh: "M20 11a8 8 0 0 0-14.5-3.5M4 4v4h4M4 13a8 8 0 0 0 14.5 3.5M20 20v-4h-4",
  rules: "M8 4h9a2 2 0 0 1 2 2v14H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm0 0v13a3 3 0 0 0-3 3M10 9h6m-6 4h6",
  bracket: "M4 5h5v5H4zM4 14h5v5H4zM15 9.5h5v5h-5zM9 7.5h3v9H9m3-4.5h3",
  groups: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  wifi: "M3 9a14 14 0 0 1 18 0M6 12.5a9.5 9.5 0 0 1 12 0M9 16a5 5 0 0 1 6 0m-3 3.5h.01",
  car: "M5 16v-4l1.6-4.4A2 2 0 0 1 8.5 6.3h7a2 2 0 0 1 1.9 1.3L19 12v4M5 16h14M5 16v2.5M19 16v2.5M7.5 13.5h.01M16.5 13.5h.01",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  calendar: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 5h14M8 3v4m8-4v4",
  fans: "M12 5.2a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4ZM6.8 19.5v-.7A5.2 5.2 0 0 1 12 13.6a5.2 5.2 0 0 1 5.2 5.2v.7M4.6 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM2.6 18.6a3.6 3.6 0 0 1 3.2-3.5M19.4 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM21.4 18.6a3.6 3.6 0 0 0-3.2-3.5",
  users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 9v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="icon" {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}
