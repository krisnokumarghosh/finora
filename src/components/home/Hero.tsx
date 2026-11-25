"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DesktopMockup, PhoneMockup } from "@/lib/utils/Devices";

/* Underline colour taken from the reference image */
const UNDERLINE = "#E6FB2D";

export default function Hero() {
  const runwayRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  /* Pinned scroll story, driven by GSAP ScrollTrigger (scrubbed timeline):
     1. the device rises from the bottom to the centre,
     2. the headline fades away,
     3. the screen content changes: Overview -> Spending -> Card. */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const runway = runwayRef.current;
    const pin = pinRef.current;
    const text = textRef.current;
    const device = deviceRef.current;
    const glow = glowRef.current;
    if (!runway || !pin || !text || !device || !glow) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const m = { startY: 0, endY: 0, fit: 1 };
      const measure = () => {
        const vh = pin.clientHeight;
        const h = device.offsetHeight;
        m.fit = Math.min(1, (vh - 48) / h);
        m.startY =
          text.offsetTop + text.offsetHeight + (window.innerWidth < 768 ? 32 : 48);
        m.endY = Math.min(m.startY, Math.max(24, (vh - h * m.fit) / 2));
      };
      measure();

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: runway,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
        },
      });

      // device rises to the centre
      tl.fromTo(
        device,
        { y: () => m.startY, scale: () => m.fit * 0.9, transformOrigin: "50% 0%" },
        { y: () => m.endY, scale: () => m.fit, ease: "power2.inOut", duration: 0.7 },
        0,
      );

      // headline leaves
      tl.to(
        text,
        { opacity: 0, y: -56, scale: 0.95, ease: "power1.out", duration: 0.4 },
        0.04,
      );

      // glow brightens
      tl.fromTo(glow, { opacity: 0.2 }, { opacity: 0.65, duration: 0.7 }, 0);

      // screen scenes: Overview -> Spending -> Card (each device has its own set)
      device.querySelectorAll<HTMLElement>("[data-device]").forEach((dev) => {
        const scene = (i: number) => dev.querySelector<HTMLElement>(`[data-scene="${i}"]`);
        const s0 = scene(0);
        const s1 = scene(1);
        const s2 = scene(2);
        if (!s0 || !s1 || !s2) return;

        const out = (el: HTMLElement, at: number) =>
          tl.to(el, { opacity: 0, y: -16, ease: "power2.in", duration: 0.08 }, at);

        const enter = (el: HTMLElement, at: number) => {
          tl.fromTo(el, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.05 }, at);
          tl.fromTo(
            el.querySelectorAll("[data-item]"),
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, ease: "power2.out", duration: 0.09, stagger: 0.02 },
            at + 0.02,
          );
          tl.fromTo(
            el.querySelectorAll("[data-bar]"),
            { scaleY: 0 },
            { scaleY: 1, ease: "power3.out", duration: 0.1, stagger: 0.012 },
            at + 0.04,
          );
          tl.fromTo(
            el.querySelectorAll("[data-fill]"),
            { scaleX: 0 },
            { scaleX: 1, ease: "power3.out", duration: 0.12 },
            at + 0.05,
          );
        };

        out(s0, 0.32);
        enter(s1, 0.34);
        out(s1, 0.6);
        enter(s2, 0.62);
      });

      // pad the timeline to exactly 1 so it maps to the full scroll distance
      tl.to({}, { duration: 0.001 }, 0.999);
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={runwayRef}
      id="home"
      className="hero-runway relative bg-white"
      style={{ height: "230svh" }}
    >
      <style>{`
        .hero-underline {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: hero-underline-draw 0.9s 0.35s ease-out forwards;
        }
        @keyframes hero-underline-draw { to { stroke-dashoffset: 0; } }

        @media (prefers-reduced-motion: reduce) {
          .hero-underline { animation: none; stroke-dashoffset: 0; }
          /* no pinning or scroll animation: plain layout, first scene shown */
          .hero-runway { height: auto !important; }
          .hero-pin { position: relative; height: auto; overflow: visible; padding-bottom: 5rem; }
          .hero-device { position: relative !important; transform: none !important; margin-top: 3rem; }
          [data-scene]:not([data-scene="0"]) { display: none; }
        }
      `}</style>

      <div ref={pinRef} className="hero-pin sticky top-0 h-svh overflow-hidden">
        <div
          ref={textRef}
          className="flex flex-col items-center px-5 pt-24 md:pt-28"
          style={{ willChange: "transform, opacity" }}
        >
          <h1 className="text-center text-[3.4rem] font-medium leading-[1.05] tracking-tight text-black sm:text-7xl lg:text-[7.5rem]">
            <span className="block md:inline">Banking</span>{" "}
            <span className="block md:inline">Made</span>{" "}
            <span className="block">Simple</span>
          </h1>

          <p className="mt-5 text-center text-sm text-black/70 sm:text-lg">
            <span className="relative inline-block font-semibold text-black">
              Zero hidden fees
              <svg
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-1.5 h-2 w-full"
              >
                <path
                  className="hero-underline"
                  d="M2 5.5C35 2.5 70 7 105 4.2S170 3 198 5"
                  pathLength={1}
                  fill="none"
                  stroke={UNDERLINE}
                  strokeWidth="2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>{" "}
            – no paperwork, no branch visits
          </p>
        </div>

        {/* Device: starts peeking from the bottom, rises to the centre */}
        <div
          ref={deviceRef}
          className="hero-device absolute left-0 top-0 z-10 w-full px-4"
          style={{
            transform: "translate3d(0, 62svh, 0) scale(0.9)",
            transformOrigin: "50% 0%",
            willChange: "transform",
          }}
        >
          {/* soft lime glow behind the device */}
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-104 w-[min(64rem,130%)] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              opacity: 0.2,
              background:
                "radial-gradient(closest-side, rgba(230,251,45,0.6), rgba(230,251,45,0))",
            }}
          />
          <div data-device className="md:hidden">
            <PhoneMockup />
          </div>
          <div data-device className="hidden md:block">
            <DesktopMockup />
          </div>
        </div>
      </div>
    </section>
  );
}