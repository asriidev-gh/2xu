'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type FAQEntry = {
  question: string;
  answer: ReactNode;
};

type FAQGroup = {
  id: string;
  title: string;
  entries: FAQEntry[];
};

const FAQ_GROUPS: FAQGroup[] = [
  {
    id: 'general',
    title: 'General Event Info',
    entries: [
      {
        question: 'What is the 2KM Speed Run?',
        answer:
          'A short-distance race focused on speed, pacing, and explosive performance—perfect for both beginners and competitive runners.',
      },
      {
        question: 'Who can join?',
        answer:
          'Open to all fitness levels. Categories may include Open, Youth, and Masters divisions.',
      },
      {
        question: 'Is this beginner-friendly?',
        answer:
          "Yes. You can run, jog, or even walk—it's designed to be inclusive and fun.",
      },
    ],
  },
  {
    id: 'mission-strong',
    title: 'Mission Strong Challenge',
    entries: [
      {
        question: 'What is the Mission Strong Challenge?',
        answer:
          'A functional fitness challenge that combines strength, endurance, and grit—designed to test your total performance beyond running.',
      },
      {
        question: 'What exercises are included?',
        answer: (
          <>
            <p className="mb-2">Challenges may include:</p>
            <ul className="list-disc space-y-1 pl-5 marker:text-orange-400">
              <li>Bear crawl + sandbag drag</li>
              <li>Tire flips</li>
              <li>Bodyweight stations</li>
            </ul>
          </>
        ),
      },
      {
        question: 'Can beginners join the challenge?',
        answer:
          'Yes! There are beginner and advanced variations for both male and female participants.',
      },
      {
        question: 'Is this separate from the 2KM run?',
        answer: (
          <>
            <p className="mb-2">It can be joined as:</p>
            <ul className="list-disc space-y-1 pl-5 marker:text-orange-400">
              <li>A standalone challenge</li>
              <li>Or part of the full Speed Series experience</li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: 'mechanics',
    title: 'Race Mechanics',
    entries: [
      {
        question: 'How is the race timed?',
        answer: 'Chip timing.',
      },
      {
        question: 'Is there a cut-off time?',
        answer: 'Yes, typically around 20–30 minutes.',
      },
      {
        question: 'Are there waves or one start?',
        answer: 'Yes.',
      },
    ],
  },
  {
    id: 'route-safety',
    title: 'Route & Safety',
    entries: [
      {
        question: 'Is the route safe?',
        answer:
          'Yes—routes are flat, clearly marked, and supported by marshals.',
      },
      {
        question: 'Are there hydration stations?',
        answer:
          'Due to the short distance, hydration is minimal or available near the finish.',
      },
      {
        question: 'Will roads be closed?',
        answer: 'Designated route will be closed.',
      },
    ],
  },
  {
    id: 'registration-kit',
    title: 'Registration & Race Kit',
    entries: [
      {
        question: 'What’s included in the race kit?',
        answer: (
          <>
            <ul className="list-disc space-y-1 pl-5 marker:text-orange-400">
              <li>Race bib</li>
              <li>Event shirt (Speed Series powered by 2XU)</li>
              <li>Finisher medal (selected categories)</li>
            </ul>
          </>
        ),
      },
      {
        question: 'When is kit claiming?',
        answer:
          'Usually 1–3 days before race day at designated locations.',
      },
    ],
  },
  {
    id: 'results-awards',
    title: 'Results & Awards',
    entries: [
      {
        question: 'Are there prizes?',
        answer: (
          <>
            <p className="mb-2">Yes! Awards are given to:</p>
            <ul className="list-disc space-y-1 pl-5 marker:text-orange-400">
              <li>Top 3 overall male & female</li>
              <li>Selected age group winners</li>
            </ul>
          </>
        ),
      },
      {
        question: 'Where can I see results?',
        answer: 'Results are posted online after the event.',
      },
    ],
  },
  {
    id: 'performance-tips',
    title: 'Performance Tips',
    entries: [
      {
        question: 'What’s a good time for 2KM?',
        answer: (
          <ul className="list-disc space-y-1 pl-5 marker:text-orange-400">
            <li>
              <span className="font-semibold text-white/90">Beginner:</span> 12–18 mins
            </li>
            <li>
              <span className="font-semibold text-white/90">Intermediate:</span> 9–12 mins
            </li>
            <li>
              <span className="font-semibold text-white/90">Advanced:</span> 6–9 mins
            </li>
          </ul>
        ),
      },
      {
        question: 'Should I sprint the whole race?',
        answer: 'No—pace yourself, then push hard in the final stretch.',
      },
      {
        question: 'What should I eat before the race?',
        answer: 'Light carbs like bananas or bread 1–2 hours before running.',
      },
    ],
  },
  {
    id: 'event-experience',
    title: 'Event Experience',
    entries: [
      {
        question: 'Is there an after-run program?',
        answer: (
          <>
            <p className="mb-2">Yes! Enjoy the Race Recover & Roll experience:</p>
            <ul className="list-disc space-y-1 pl-5 marker:text-orange-400">
              <li>Music</li>
              <li>Recovery zone (stretching, foam rolling)</li>
              <li>Sponsor booths & community activities</li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: 'rules',
    title: 'Rules & Reminders',
    entries: [
      {
        question: 'Can I walk the race?',
        answer: 'Yes.',
      },
      {
        question: 'Are pets or strollers allowed?',
        answer: 'Depends on safety guidelines—check event rules.',
      },
      {
        question: 'What if it rains?',
        answer: 'The event continues unless conditions are unsafe.',
      },
    ],
  },
];

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '-50px 0px -50px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToRegistration = () => {
    const registrationSection = document.getElementById('registration');
    if (registrationSection) {
      const headerOffset = 80;
      const elementPosition = registrationSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative overflow-hidden scroll-mt-24 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-black to-gray-900"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-orange-600/50 to-yellow-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-yellow-500/30 to-orange-500/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_55%)]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl">
        <div
          className={`mb-12 text-center sm:mb-14 ${isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
          style={{ animationDelay: '0.15s' }}
        >
          <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2 shadow-lg shadow-orange-500/20">
            <span className="text-sm font-semibold uppercase tracking-wide text-white font-fira-sans">
              Got questions?
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-white font-druk drop-shadow-lg sm:text-5xl lg:text-6xl">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-md" />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 font-sweet-sans">
            Everything you need to know about the 2KM Speed Run, Mission Strong Challenge, and the Speed Series
            powered by 2XU.
          </p>
        </div>

        <div className="space-y-10 sm:space-y-12">
          {FAQ_GROUPS.map((group, groupIndex) => (
            <div
              key={group.id}
              className={`${isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
              style={{ animationDelay: `${0.2 + groupIndex * 0.05}s` }}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="h-2 w-2 rotate-45 bg-gradient-to-br from-orange-400 to-yellow-400 shadow-sm shadow-orange-500/50" />
                <h3 className="text-xl font-bold tracking-tight text-white font-druk sm:text-2xl">{group.title}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              </div>

              <div className="space-y-3">
                {group.entries.map((entry) => (
                  <details
                    key={entry.question}
                    className="group rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors open:border-orange-500/35 open:bg-white/[0.07]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left font-fira-sans font-semibold text-white transition-colors hover:text-orange-200 sm:px-5 [&::-webkit-details-marker]:hidden">
                      <span className="pr-2 text-sm sm:text-base">{entry.question}</span>
                      <ChevronIcon className="shrink-0 text-orange-400 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-white/10 px-4 pb-4 pt-0 text-sm leading-relaxed text-gray-300 font-sweet-sans sm:px-5 sm:text-base">
                      <div className="pt-3">{entry.answer}</div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className={`mt-14 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-600/20 via-white/5 to-yellow-500/10 p-8 text-center shadow-xl backdrop-blur-md sm:mt-16 sm:p-10 ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '0.5s' }}
        >
          <h3 className="mb-3 text-2xl font-bold text-white font-druk sm:text-3xl">Ready to Race?</h3>
          <p className="mx-auto mb-6 max-w-xl text-gray-200 font-sweet-sans">
            Join the Speed Series powered by 2XU and take on both speed and strength with the 2KM Run + Mission Strong
            Challenge.
          </p>
          <button
            type="button"
            onClick={scrollToRegistration}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-400 hover:shadow-orange-500/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 font-fira-sans"
          >
            Secure your spots now!
          </button>
        </div>
      </div>
    </section>
  );
}
