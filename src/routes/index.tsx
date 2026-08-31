import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BrandLogo } from "~/components/BrandLogo";
import {
  Button,
  Check,
  ChevronRight,
  Info,
  ShieldAlert,
  Sparkles,
} from "~/components/ui";

export const Route = createFileRoute("/")({
  component: Home,
});

const gridStyle: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, var(--color-edge) 1px, transparent 0)",
  backgroundSize: "40px 40px",
};

const eyebrowGradient =
  "bg-gradient-to-r from-accent-400 to-teal-400 bg-clip-text text-transparent";
const heroGradient =
  "bg-gradient-to-r from-accent-300 via-accent-400 to-teal-300 bg-clip-text text-transparent";

/* Shared section heading — keeps every section on the same visual rhythm. */
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className={`${eyebrowGradient} text-xs sm:text-sm font-semibold uppercase tracking-widest`}
      >
        {eyebrow}
      </span>
      <h2
        data-reveal
        className="reveal mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-ink-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mx-auto mt-3 sm:mt-4 flex max-w-5xl items-center justify-between rounded-2xl border border-edge bg-panel/80 px-4 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo markClassName="h-8 w-8" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <Button size="sm" variant="secondary" href="/login">
                Launch Demo
              </Button>
              <Button size="sm" variant="ghost" href="/login">
                Sign in
              </Button>
              <Button size="sm" href="/register">
                Get started
              </Button>
            </div>
            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink md:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-edge bg-panel/95 p-3 animate-fade-in backdrop-blur-xl md:hidden">
            <div className="flex flex-col">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-edge pt-3">
                <Button variant="secondary" href="/login" fullWidth>
                  Launch Demo
                </Button>
                <Button href="/register" fullWidth>
                  Get started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function QuickExploreCards() {
  const cards = [
    { icon: "👀", label: "See Call Analysis" },
    { icon: "🎯", label: "Try Role-Play" },
    { icon: "📊", label: "View Analytics" },
    { icon: "🏆", label: "Leaderboard" },
  ];

  return (
    <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0">
      {cards.map((card, i) => (
        <a
          key={i}
          href="/login"
          className="group flex items-center justify-center gap-3 rounded-xl border border-edge bg-panel/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-ink-muted backdrop-blur-xl transition-all duration-300 hover:border-accent-500/40 hover:text-ink animate-fade-in w-full sm:w-auto"
          style={{
            animationDelay: `${i * 100 + 200}ms`,
            animationFillMode: "both",
          }}
        >
          <span className="text-sm sm:text-base">{card.icon}</span>
          <span>{card.label}</span>
          <svg
            className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-fg transition-transform duration-300 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </a>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-screen overflow-hidden pt-20 sm:pt-24">
      {/* Background effects */}
      <div className="absolute inset-0" style={gridStyle} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] sm:h-[500px] sm:w-[500px] -translate-x-1/2 rounded-full bg-accent-600/20 blur-[120px]" />
        <div className="absolute top-1/4 right-0 h-[200px] w-[200px] sm:h-[300px] sm:w-[300px] rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-full bg-accent-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center pt-12 sm:pt-16 text-center">
          {/* Badge */}
          <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-edge bg-panel/80 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-ink-muted backdrop-blur-xl">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500" />
            AI-Powered Sales Coaching
          </div>

          {/* Headline */}
          <h1 className="mt-4 sm:mt-6 max-w-4xl text-[2rem] leading-[1.15] sm:text-6xl md:text-7xl font-extrabold tracking-tight text-ink">
            Turn Every Sales Call Into{" "}
            <span className={heroGradient}>a Coaching Opportunity</span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-ink-muted">
            AI agents analyze calls, detect objections, grade performance, and
            deliver personalized coaching plans — automatically. No extra
            headcount required.
          </p>

          {/* Main CTA — large, tappable on mobile */}
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0 sm:justify-center">
            <Button
              size="lg"
              variant="secondary"
              href="/login"
              className="w-full sm:w-auto"
            >
              Launch Demo
            </Button>
            <Button
              size="lg"
              href="/register"
              className="w-full sm:w-auto"
              rightIcon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              }
            >
              Start free trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              href="/demo.html"
              target="_blank"
              className="w-full sm:w-auto"
            >
              Watch demo
            </Button>
          </div>

          {/* No signup required */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-ink-faint">
            <svg
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Sign in to access the full dashboard
          </p>

          {/* Hero Image — full-width framed product preview */}
          <div className="mt-8 sm:mt-12 w-full max-w-5xl animate-fade-up">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-3 sm:-inset-6 rounded-3xl bg-gradient-to-r from-accent-500/25 via-accent-500/5 to-teal-500/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-edge bg-panel p-1 sm:p-2 shadow-2xl shadow-accent-900/40 ring-1 ring-white/10">
                <img
                  src="/dashboard-shot.png"
                  alt="ElevateAI dashboard preview"
                  className="w-full rounded-xl"
                  loading="lazy"
                />
                  
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-edge" />
                {/* Floating live-call chip */}
                <div className="absolute left-2 top-4 sm:-left-4 sm:top-10 flex items-center gap-2 rounded-xl border border-edge bg-panel/90 px-3 py-2 shadow-lg backdrop-blur-xl animate-float">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-medium text-ink">
                    Live call scoring
                  </span>
                </div>
                {/* Floating coaching chip */}
                <div
                  className="absolute right-2 bottom-4 sm:-right-4 sm:bottom-10 flex items-center gap-2 rounded-xl border border-edge bg-panel/90 px-3 py-2 shadow-lg backdrop-blur-xl animate-float"
                  style={{ animationDelay: "1.5s" }}
                >
                  <svg
                    className="h-3.5 w-3.5 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4"
                    />
                  </svg>
                  <span className="text-xs font-medium text-ink">
                    Coaching plan ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations (in-scope tools, not endorsements) */}
          <div className="mt-10 sm:mt-16 flex flex-col items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-ink-faint">
              Integrates with your existing stack
            </p>
            <p className="max-w-2xl text-sm sm:text-base text-ink-faint">
              Salesforce &amp; HubSpot CRMs · Five9, RingCentral, Aircall &amp;
              Twilio dialers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      title: "You can't listen to every call",
      description:
        "Managers coach from a handful of calls a month. Most conversations are never reviewed — and the same mistakes repeat in the dark.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      ),
      title: "Coaching doesn't scale",
      description:
        "Every manager coaches differently. Best practices live in one person's head instead of becoming the whole team's playbook.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM7.5 3.75h9l.75.75v6.75c0 4.5-3 7.5-5.25 9-2.25-1.5-5.25-4.5-5.25-9V4.5l.75-.75z"
          />
        </svg>
      ),
      title: "Risk hides in conversations",
      description:
        "A missed disclosure or an unapproved claim can cost you. Compliance issues go unnoticed until someone finally reviews the recording.",
    },
  ];

  return (
    <section id="problem" className="relative py-16 sm:py-32">
      <div className="absolute inset-0 opacity-30" style={gridStyle} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 right-0 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-y-1/2 rounded-full bg-accent-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="The problem"
          title="Your best coaching can't keep up"
          description="Sales conversations hold your biggest coaching opportunities — but most of them never get heard."
        />

        <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 md:grid-cols-3">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-xl sm:rounded-2xl border border-edge bg-panel p-5 sm:p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-fg ring-1 ring-accent-500/20">
                {p.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatItDoesSection() {
  const questions = [
    {
      question: "Are our people performing?",
      answer:
        "Every call is transcribed, analyzed, and scored against your configurable KPIs — automatically.",
    },
    {
      question: "Are they following the process?",
      answer:
        "AI checks discovery, objection handling, and messaging against your own scorecards and scripts.",
    },
    {
      question: "Are they creating risk?",
      answer:
        "Compliance rules flag prohibited claims and missing disclosures — surfaced separately from sales performance.",
    },
  ];

  return (
    <section id="what-it-does" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-accent-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="What ElevateAI does"
          title="Three questions, answered for every call"
          description="Leadership shouldn't guess. ElevateAI turns every conversation into clear, evidence-based answers."
        />

        <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 md:grid-cols-3">
          {questions.map((q, i) => (
            <div
              key={q.question}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-edge bg-panel p-5 sm:p-6"
            >
              <span className="absolute top-4 right-5 text-3xl sm:text-4xl font-extrabold text-ink-faint/20 select-none">
                0{i + 1}
              </span>
              <h3 className="pr-10 text-lg sm:text-xl font-bold text-ink">
                {q.question}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {q.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      ),
      title: "AI Call Analysis",
      description:
        "Every call is automatically transcribed, analyzed, and scored. AI identifies keywords, objection handling, talk-listen ratios, and compliance risks.",
      benefit: "Find coaching moments in every call automatically.",
      link: "/login",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
          />
        </svg>
      ),
      title: "Smart Scorecards",
      description:
        "Customizable scorecards to grade every rep on the metrics that matter. Track improvement over time with data-driven insights.",
      benefit: "Grade reps on the metrics that actually matter to you.",
      link: "/login",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          />
        </svg>
      ),
      title: "Live Coaching",
      description:
        "Real-time AI suggestions during calls. Reps get live prompts for objection handling, next-best-action, and compliance reminders.",
      benefit: "Reps get prompts in the moment — not after the deal is gone.",
      link: "/login",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      ),
      title: "AI Role-Playing",
      description:
        "Practice against AI-powered prospects. Reps sharpen skills with realistic scenarios tailored to your product and market.",
      benefit: "Reps practice safely before they're live with prospects.",
      link: "/login",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      ),
      title: "Manager Dashboards",
      description:
        "Full visibility into team performance, conversion trends, coaching ROI, and individual rep growth — all in one place.",
      benefit: "See team performance and coaching ROI at a glance.",
      link: "/login",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
      title: "Team Collaboration",
      description:
        "Share best practices across the team. Managers assign coaching plans, track completion, and celebrate wins with leaderboards.",
      benefit: "Turn one rep's win into the whole team's playbook.",
      link: "/login",
    },
  ];

  return (
    <section id="features" className="relative py-16 sm:py-32">
      <div className="absolute inset-0 opacity-50" style={gridStyle} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-y-1/2 rounded-full bg-accent-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Features"
          title="Everything You Need to Elevate Your Team"
          description="From AI-powered call analysis to live coaching and gamified learning — ElevateAI gives sales leaders the tools to build elite teams."
        />

        <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <a
              key={feature.title}
              href={feature.link}
              className="group cursor-pointer rounded-xl sm:rounded-2xl border border-edge bg-panel p-4 sm:p-6 text-left transition-all duration-300 hover:border-accent-500/40 hover:shadow-glow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-fg ring-1 ring-accent-500/20 transition-all duration-300 group-hover:bg-accent-500/20 group-hover:ring-accent-500/40">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {feature.description}
              </p>
              <p className="mt-3 flex items-start gap-2 text-xs font-medium text-accent-fg">
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {feature.benefit}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent-fg opacity-0 transition-all duration-300 group-hover:opacity-100">
                Explore {feature.title}
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Connect your calls",
      description:
        "Recorded and live calls flow into ElevateAI from your existing dialer or CRM workflow.",
    },
    {
      step: "02",
      title: "AI analyzes every call",
      description:
        "Calls are transcribed and graded against your configurable scorecards, KPIs, and compliance rules.",
    },
    {
      step: "03",
      title: "Coaching reaches reps automatically",
      description:
        "Personalized coaching plans are delivered to each rep's email or chat — no extra login required.",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-16 sm:py-32">
      <div className="absolute inset-0 opacity-30" style={gridStyle} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="How it works"
          title="From call to coaching, automatically"
          description="ElevateAI turns every sales call into coaching, performance, and compliance intelligence."
        />

        <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="rounded-xl sm:rounded-2xl border border-edge bg-panel p-5 sm:p-6"
            >
              <span className="text-sm font-bold text-accent-fg">
                {s.step}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreviewSection() {
  return (
    <section id="for-managers" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-accent-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="For sales leaders"
          title="A command center for managers"
          description="Full visibility into team performance, coaching ROI, and individual rep growth — all in one place."
        />

                <div className="mt-12 sm:mt-16 overflow-hidden rounded-2xl border border-edge bg-panel shadow-xl shadow-accent-900/30">
          <img
            src="/dashboard-shot.png"
            alt="ElevateAI manager dashboard"
            className="w-full"
            loading="lazy"
          />
        </div>
      {/* Annotation Labels */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-edge bg-panel p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-fg">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Real-time Stats</p>
              <p className="mt-1 text-xs text-ink-faint">
                Live call metrics, conversion rates, and team performance at a
                glance
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-edge bg-panel p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-fg">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Call Transcripts</p>
              <p className="mt-1 text-xs text-ink-faint">
                Full transcripts with AI analysis, sentiment scoring, and
                keyword detection
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-edge bg-panel p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-fg">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Scorecards</p>
              <p className="mt-1 text-xs text-ink-faint">
                AI-powered grading with customizable rubrics and performance
                trends
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Button
            size="lg"
            href="/login"
            rightIcon={
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            }
          >
            Explore the Dashboard
          </Button>
          <p className="mt-3 text-sm text-ink-faint">
            Sign in to access the full dashboard experience
          </p>
        </div>
      </div>
    </section>
  );
}

function AICoachingSection() {
  const capabilities = [
    {
      title: "Personalized coaching plans",
      description:
        "AI builds a coaching plan for every rep from their actual call data — not a generic template.",
    },
    {
      title: "Delivered to email & chat",
      description:
        "Coaching, scorecards, and prompts land in the email or Slack/Teams your reps already use. No new login.",
    },
    {
      title: "Live coaching during calls",
      description:
        "Real-time prompts for objections and next-best-action — discreet, and visible only to the rep.",
    },
    {
      title: "Role-play practice",
      description:
        "Reps sharpen skills against AI-powered prospects before they're live with a real buyer.",
    },
  ];

  return (
    <section id="ai-coaching" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-1/4 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Copy + capabilities */}
          <div>
            <span
              className={`${eyebrowGradient} text-xs sm:text-sm font-semibold uppercase tracking-widest`}
            >
              AI coaching for reps
            </span>
            <h2
              data-reveal
              className="reveal mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink"
            >
              Coaching that reaches every rep — without another login
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-muted">
              No new tool to learn. ElevateAI meets reps where they already
              work and turns every call into a personal growth plan.
            </p>

            <div className="mt-8 space-y-4">
              {capabilities.map((c) => (
                <div key={c.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-accent-fg ring-1 ring-accent-500/20">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{c.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {c.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching plan mockup (abstract, no fabricated numbers) */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-3 sm:-inset-6 rounded-3xl bg-gradient-to-r from-accent-500/20 via-accent-500/5 to-teal-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-edge bg-panel p-5 sm:p-6 shadow-2xl shadow-accent-900/40">
              <div className="flex items-center justify-between border-b border-edge pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-fg">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Personalized coaching plan
                    </p>
                    <p className="text-xs text-ink-faint">Sent to rep's email</p>
                  </div>
                </div>
                <span className="rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-medium text-accent-fg">
                  This week
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { label: "Focus area", value: "Objection handling" },
                  { label: "Next action", value: "Practice 3 discovery questions" },
                  { label: "Skill gap", value: "Talk-listen ratio on late-stage calls" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg bg-panel-raised/60 px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-ink-faint">
                      {row.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-edge bg-panel-raised/40 px-4 py-3">
                <span className="text-xs text-ink-muted">
                  Delivered via email · Slack · Teams
                </span>
                <ChevronRight className="h-4 w-4 text-accent-fg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  const items = [
    {
      icon: <Info className="h-5 w-5" />,
      title: "Configurable, not hard-coded",
      description:
        "Your KPIs, scorecards, and compliance rules. ElevateAI ships industry-agnostic — you define what matters.",
    },
    {
      icon: <Check className="h-5 w-5" />,
      title: "Honest by design",
      description:
        "Business outcomes only appear when your CRM is connected. No guessed numbers, ever.",
    },
    {
      icon: <ShieldAlert className="h-5 w-5" />,
      title: "Enterprise security",
      description:
        "SSO/SAML, encrypted transport, and full audit logging on Scale plans.",
    },
    {
      icon: <ChevronRight className="h-5 w-5" />,
      title: "Plays with your stack",
      description:
        "Salesforce, HubSpot, Five9, RingCentral, Aircall, and Twilio — in-scope integrations.",
    },
  ];

  return (
    <section id="trust" className="relative py-16 sm:py-32">
      <div className="absolute inset-0 opacity-30" style={gridStyle} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Built to be trusted"
          title="Credible, configurable, and honest by design"
          description="Enterprise sales teams rely on ElevateAI because it works the way they do — not the other way around."
        />

        <div className="mt-12 sm:mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl sm:rounded-2xl border border-edge bg-panel p-5 sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-fg ring-1 ring-accent-500/20">
                {item.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs sm:text-sm text-ink-faint">
          ElevateAI surfaces AI analysis to assist human review. It does not
          provide legal advice — low-confidence compliance findings are always
          flagged for human review.
        </p>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "299",
      period: "/manager/mo",
      description: "For teams getting started with AI coaching — min 3 manager seats",
      stripeLink: "https://buy.stripe.com/cNi3cv8G1ctZc7C2gs1wY06",
      features: [
        "AI call analysis & transcription",
        "Basic scorecards & manager dashboards",
        "Email coaching delivery for reps",
        "30-day call storage",
        "Min 3 manager seats (from $897/mo)",
        "Email support",
      ],
      cta: "Subscribe now",
      popular: false,
    },
    {
      name: "Growth",
      price: "599",
      period: "/manager/mo",
      description: "For growing teams — full AI coaching, CRM integrations — min 5 seats",
      stripeLink: "https://buy.stripe.com/14A00jcWh65B8Vq2gs1wY07",
      features: [
        "Everything in Starter, plus:",
        "Live AI coaching delivery via Teams/Slack",
        "AI role-playing scenarios & practice",
        "Custom scorecards & rubrics",
        "CRM integrations (Salesforce, HubSpot, etc.)",
        "Advanced analytics & reports",
        "90-day call storage",
        "Min 5 manager seats (from $2,995/mo)",
        "Priority support",
      ],
      cta: "Subscribe now",
      popular: true,
    },
    {
      name: "Scale",
      price: "999",
      period: "/manager/mo",
      description: "For large organizations — full customization & white-label — min 10 seats",
      stripeLink: "https://buy.stripe.com/3cI5kDf4pgKfefK6wI1wY08",
      features: [
        "Everything in Growth, plus:",
        "White-label / custom domain",
        "API access & custom integrations",
        "SSO / SAML authentication",
        "Dedicated success manager",
        "Unlimited call storage",
        "Unlimited manager seats",
        "Min 10 seats (from $9,990/mo)",
        "SLA guarantees",
      ],
      cta: "Subscribe now",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 right-0 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-accent-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Pricing"
          title="Per-Manager Pricing"
          description="Pay for the managers who use it. Reps get coaching at no extra cost. Start with a free trial."
        />

        <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-panel p-6 sm:p-8 ${
                plan.popular
                  ? "border-accent-500/60 ring-2 ring-accent-500/40"
                  : "border-edge"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="whitespace-nowrap rounded-full bg-accent-600 px-4 py-1 text-xs font-semibold text-ink">
                    Most popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-ink">{plan.name}</h3>
              <p className="mt-2 text-sm text-ink-muted">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-ink">
                  ${plan.price}
                </span>
                <span className="text-sm text-ink-muted">{plan.period}</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Billed monthly per manager seat
              </p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-ink-muted"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-fg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.stripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-accent-600 text-ink shadow-glow hover:bg-accent-500 active:bg-accent-700 active:scale-[0.98]"
                    : "border border-edge bg-panel-raised text-ink hover:border-edge-strong hover:bg-graphite-850 active:scale-[0.98]"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-faint">
          All plans include a 14-day free trial. Reps are always free — you only
          pay for manager seats.
        </p>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "How does ElevateAI analyze sales calls?",
      answer:
        "ElevateAI uses advanced AI models to transcribe and analyze every call in real-time. It evaluates talk-listen ratios, objection handling, key messaging, compliance, and more — then generates a comprehensive scorecard automatically.",
    },
    {
      question: "Can I customize the scorecards?",
      answer:
        "Yes! Growth and Scale plans allow you to create custom scorecards with your own criteria, weighting, and grading rubrics. You can tailor them to your specific sales methodology and KPIs.",
    },
    {
      question: "Does ElevateAI integrate with my CRM?",
      answer:
        "Absolutely. CRM integrations are included in our Growth and Scale plans — connecting with Salesforce, HubSpot, and major dialers like Five9, RingCentral, Aircall, and Twilio. Scale plans also include custom API integrations.",
    },
    {
      question: "How does live coaching work?",
      answer:
        "During a live call, our AI listens in real-time and provides subtle prompts to the rep — objection responses, next-best-action suggestions, compliance reminders — displayed in a discreet overlay. Only the rep sees these prompts.",
    },
    {
      question: "How do we measure improvement?",
      answer:
        "ElevateAI reports call performance, coaching completion, and process adherence out of the box. Business outcomes like conversion and revenue are only shown when a CRM is connected — so you never see guessed numbers, only metrics backed by your own data.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. ElevateAI is built for enterprise — Scale plans include SSO/SAML and full audit logging, and all data is transmitted over encrypted HTTPS connections.",
    },
  ];

  return (
    <section id="faq" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
        />

        <div className="mt-12 sm:mt-16 space-y-3 sm:space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-edge bg-panel transition-all duration-300 open:bg-panel-raised/40"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 sm:p-6 text-sm font-semibold text-ink transition-colors hover:text-accent-fg [&::-webkit-details-marker]:hidden">
                {faq.question}
                <svg
                  className="h-5 w-5 flex-shrink-0 text-ink-faint transition-transform duration-300 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <p className="text-sm leading-relaxed text-ink-muted">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="demo" className="relative py-16 sm:py-32">
      <div className="absolute inset-0" style={gridStyle} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-900/5 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-edge bg-panel p-8 sm:p-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-600/10 via-transparent to-teal-500/10" />

          <div className="relative">
            <h2
              data-reveal
              className="reveal text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink"
            >
              Ready to Elevate Your Sales Team?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-ink-muted">
              Start your free trial today and turn every sales call into
              coaching, performance, and compliance intelligence. No credit card
              required.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                size="lg"
                href="/register"
                className="w-full sm:w-auto"
                rightIcon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                }
              >
                Start free trial
              </Button>
              <Button
                size="lg"
                variant="secondary"
                href="#features"
                className="w-full sm:w-auto"
              >
                Learn more
              </Button>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              14-day free trial · No credit card · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandLogo
              markClassName="h-6 w-6"
              wordmarkClassName="text-sm font-bold tracking-tight text-ink"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <a href="#features" className="transition-colors hover:text-ink">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-ink">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-ink">
              FAQ
            </a>
            <a href="#" className="transition-colors hover:text-ink">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-ink">
              Terms
            </a>
          </div>
          <p className="text-sm text-ink-faint">
            &copy; {new Date().getFullYear()} ElevateAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Home() {
  // Scroll-reveal: fade/slide sections in as they enter the viewport
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("reveal-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <WhatItDoesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DashboardPreviewSection />
        <AICoachingSection />
        <SocialProofSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
