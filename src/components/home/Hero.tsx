"use client";

import { DesktopMockup, PhoneMockup } from "@/lib/utils/Devices";

/* Underline colour taken from the reference image */
const UNDERLINE = "#E6FB2D";

export default function Hero() {
  return (
    <section id="home" className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center overflow-hidden bg-white px-5 pt-10 md:pt-14">
      <style>{`
        .hero-underline {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: hero-underline-draw 0.9s 0.35s ease-out forwards;
        }
        @keyframes hero-underline-draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .hero-underline { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <h1
        className={` mt-8 text-center text-[3.4rem] font-medium leading-[1.05] tracking-tight text-black sm:text-7xl lg:text-[7.5rem]`}
      >
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

      {/* Devices: cropped by the bottom of the hero */}
      <div className="mt-auto w-full pt-14">
        <div className="h-67.5 overflow-hidden md:hidden">
          <PhoneMockup />
        </div>
        <div className="hidden h-80 overflow-hidden md:block">
          <DesktopMockup />
        </div>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laboriosam, eos placeat reprehenderit, ex aut voluptatem minima, distinctio voluptates sunt eaque ullam mollitia necessitatibus dolorem quo! Culpa, laudantium. Minus deleniti minima nesciunt pariatur ut, rem quae inventore neque consectetur animi fugiat asperiores laboriosam quo cumque! Dolor, expedita magnam ratione quo ipsa, consectetur nulla animi officiis maxime id ab ex earum? Natus omnis dolorum quasi laboriosam provident corporis accusantium maxime voluptatem ipsum? Sint sed tempore ipsa natus, nam explicabo similique earum sequi aspernatur. Repellendus neque minima quas quasi in eum necessitatibus, excepturi temporibus doloribus iste odio alias sit mollitia! Voluptate nobis praesentium non assumenda alias rerum optio odit eum nisi totam aliquam libero aut enim, cum, veniam impedit necessitatibus hic accusantium expedita sed laboriosam minima accusamus! Sapiente ratione hic, eligendi voluptatibus eum earum dignissimos necessitatibus doloremque! Nemo cumque totam laborum expedita quasi minus libero dolores reprehenderit animi suscipit similique quibusdam officia, tempore ad delectus illo modi maiores ea commodi quo! Quibusdam voluptatum quia iure fugiat molestiae voluptatibus eligendi tenetur praesentium natus. Ducimus neque laudantium, sint suscipit quas excepturi. Sit quidem id nulla eligendi ipsum, suscipit cumque dolores beatae maiores, doloribus sunt dolorem qui harum similique odio fugit, ratione sed. Eaque, quo nisi.
      </div>
    </section>
  );
}
