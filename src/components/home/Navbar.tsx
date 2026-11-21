"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Logo } from "@/lib/utils/Logo";
import {
  AccountsIcon,
  FeaturesIcon,
  PricingIcon,
  SecurityIcon,
} from "@/lib/utils/NavIcons";

const NAV_ITEMS = [
  { label: "Home", href: "#home", Icon: FeaturesIcon },
  { label: "Accounts", href: "#accounts", Icon: AccountsIcon },
  { label: "Security", href: "#security", Icon: SecurityIcon },
  { label: "Pricing", href: "#pricing", Icon: PricingIcon },
] as const;

/** Highlights the link whose section is currently in view. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/** Hides the bar while scrolling down, shows it again on scroll up. */
function useHideOnScroll(threshold = 8, topOffset = 64) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y < topOffset) {
        setHidden(false); // always visible near the top
        lastY = y;
      } else if (Math.abs(y - lastY) > threshold) {
        setHidden(y > lastY); // down = hide, up = show
        lastY = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset]);

  return { hidden, show: () => setHidden(false) };
}

const ids = NAV_ITEMS.map((i) => i.href.slice(1));

export default function Navbar() {
  const router = useRouter();
  const active = useActiveSection(ids);
  const { hidden, show } = useHideOnScroll();

  // Mark a tapped item as selected right away; scroll-spy takes over once it arrives.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(null), 1500);
    return () => clearTimeout(t);
  }, [pending]);
  const current = pending ?? active;
  const getStarted = (
    <Button
      onPress={() => router.push("/login")}
      className="h-11 rounded-full bg-[#2C2C2C] px-7 py-2.5 text-sm font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
    >
      Get started
    </Button>
  );

  return (
    <>
      {/* Top bar */}
      <header
        onFocusCapture={show}
        className={`sticky top-0 z-50 w-full  bg-white/80 backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16  items-center justify-between px-5 md:px-8"
        >
          <Link href="/" aria-label="Finora home" className="rounded-md">
            <Logo />
          </Link>

          <div className="flex items-center gap-8">
            {/* Desktop links */}
            <ul className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.href.slice(1);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "location" : undefined}
                      className={`rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors duration-200 hover:border-[#E6FB2D] hover:bg-white hover:text-black ${
                        isActive
                          ? "text-black  border-[#E6FB2D]"
                          : "text-black/55"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {getStarted}
          </div>
        </nav>
      </header>

      {/* Mobile glass dock */}
      <nav
        aria-label="Sections"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <ul className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/70 bg-white/60 p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/5 backdrop-blur-2xl backdrop-saturate-150">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const id = href.slice(1);
            const isActive = current === id;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => setPending(id)}
                  className={`flex h-11 items-center rounded-full transition-all duration-300 ease-out motion-reduce:transition-none active:scale-95 ${
                    isActive
                      ? "bg-[#2C2C2C] px-4 text-white shadow-[0_4px_14px_-2px_rgba(44,44,44,0.5)]"
                      : "w-11 justify-center text-black/60"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 transition-colors duration-300 ${
                      isActive ? "text-[#E6FB2D]" : ""
                    }`}
                  />
                  <span
                    className={`overflow-hidden whitespace-nowrap text-[13px] font-medium transition-all duration-300 ease-out motion-reduce:transition-none ${
                      isActive
                        ? "ml-2 max-w-20 opacity-100"
                        : "ml-0 max-w-0 opacity-0"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
