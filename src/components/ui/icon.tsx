import type { ComponentProps } from "react";

const paths = {
  question: <path d="M9 8a3 3 0 1 1 5.2 2c-1.3.8-2.2 1.4-2.2 3m0 4h.01" />,
  api: <path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.01" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  reset: <path d="M3 10a9 9 0 1 1 1 7M3 4v6h6" />,
  loader: <path d="M12 3a9 9 0 1 1-9 9" />,
  volume: (
    <path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
  ),
  mute: <path d="m11 4-6 5H2v6h3l6 5V4Zm6 5 5 6m0-6-5 6" />,
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8Z" />,
  leaf: (
    <>
      <path d="M20 3C9 1 2 7 4 14s15 9 16-11Z" />
      <path d="M3 21 15 9" />
    </>
  ),
  flower: (
    <>
      <path d="M12 7C6-2 0 9 7 12c-9 6 2 12 5 5 6 9 12-2 5-5 9-6-2-12-5-5Z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  cherry: (
    <>
      <circle cx="6" cy="17" r="4" />
      <circle cx="18" cy="17" r="4" />
      <path d="M6 13C6 6 11 8 13 2c0 6 5 6 5 11M13 2c5-1 7 1 8 4-4 0-6-1-8-4Z" />
    </>
  ),
  gem: (
    <>
      <path d="m3 8 4-5h10l4 5-9 13Z" />
      <path d="M3 8h18M8 8l4 13 4-13M7 3l1 5m9-5-1 5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="6" rx="7" ry="3" />
      <path d="M2 6v5c0 4 14 4 14 0V6M2 11v5c0 2 4 3 7 3m9-10c6 1 6 5 0 6m-6 2c0 4 10 4 10 0v-5m-10 5v4c0 4 10 4 10 0v-4" />
    </>
  ),
  devices: (
    <>
      <rect x="2" y="3" width="15" height="12" rx="2" />
      <path d="M6 20h7M9 15v5" />
      <rect x="16" y="9" width="6" height="12" rx="1" />
    </>
  ),
  history: (
    <>
      <path d="M3 10a9 9 0 1 1 0 5M3 4v6h6M12 7v5l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  github: (
    <>
      <path
        d="M9 19c-4.3 1.3-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-1-2.7c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.2 4a5.4 5.4 0 0 0-.1-4s-1.3-.4-4.1 1.5a14 14 0 0 0-7.4 0C4.8-.4 3.5 0 3.5 0a5.4 5.4 0 0 0-.1 4A5.8 5.8 0 0 0 1.8 8c0 5.8 3.5 7 6.8 7.4a3.4 3.4 0 0 0-1 2.7V22"
        transform="translate(1 1) scale(.91)"
      />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10v7m0-10v.01M11 17v-7m0 3a3 3 0 0 1 6 0v4" />
    </>
  ),
} as const;

export function Icon({
  name,
  ...props
}: ComponentProps<"svg"> & { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
