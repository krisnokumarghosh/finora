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
      <rect width="32" height="32" rx="8" fill="#2C2C2C" />
      {/* F with rounded corner and rounded ends */}
      <path
        d="M10 24V12.5Q10 8 14.5 8H20.25A2.25 2.25 0 0 1 20.25 12.5H14.5V24A2.25 2.25 0 0 1 10 24Z"
        fill="#FFFFFF"
      />
      {/* coin */}
      <circle cx="19.5" cy="18.25" r="3.5" fill="#E6FB2D" />
      <circle
        cx="19.5"
        cy="18.25"
        r="1.5"
        stroke="#2C2C2C"
        strokeWidth="0.75"
      />
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

export function LogoLight() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="size-8" />
      <span className="text-lg font-semibold tracking-tight text-[#FFFFFF]">
        FINORA
      </span>
    </span>
  );
}