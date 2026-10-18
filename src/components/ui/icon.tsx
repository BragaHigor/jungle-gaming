import type { ComponentProps } from "react";

const paths = {
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
