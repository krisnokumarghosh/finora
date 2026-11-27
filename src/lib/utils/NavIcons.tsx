import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const FeaturesIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </svg>
);

export const AccountsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M19.5 8V6.5A2.5 2.5 0 0 0 17 4H6a2.5 2.5 0 0 0 0 5h13.5a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-1.5 1.5H6A2.5 2.5 0 0 1 3.5 17.5V6.5" />
    <circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const SecurityIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const TestimonialsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5v-8Z" />
    <path d="M8.5 8h7M8.5 11.5h4" />
  </svg>
);