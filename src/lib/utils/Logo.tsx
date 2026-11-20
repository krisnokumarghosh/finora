import type { SVGProps } from "react";

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="9" fill="#2C2C2C" />
      {/* F built from a vertical stem and two bars */}
      <path
        d="M11 23V9.5h10.5M11 15.5h7"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* coin dot */}
      <circle cx="22" cy="21.5" r="3" fill="#E6FB2D" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="size-8" />
      <span className="text-lg font-semibold tracking-tight text-black">
        FINORA
      </span>
    </span>
  );
}