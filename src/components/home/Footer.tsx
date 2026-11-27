import Link from "next/link";
import { Red_Hat_Display } from "next/font/google";

const display = Red_Hat_Display({ subsets: ["latin"] });

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Testimonials", href: "#testimonials" },
] as const;


async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}

export default function Footer() {
  return (
    <footer
      className={`${display.className} rounded-t-[1.75rem] bg-[#434343] text-white sm:rounded-t-[2.25rem]`}
    >
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-12 sm:px-8 md:pb-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
          <Link
            href="/"
            aria-label="Finora home"
            className="inline-flex items-center gap-2.5 rounded-md"
          >
            <span className="text-lg font-bold tracking-wide">FINORA</span>
          </Link>

          <span aria-hidden="true" className="hidden h-8 w-px bg-white/15 sm:block" />

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-white/60 transition-colors duration-200 hover:text-[#E6FB2D] focus-visible:text-[#E6FB2D]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50 sm:text-right">
          © <CopyrightYear /> Finora. All rights reserved
        </div>
      </div>
    </footer>
  );
}