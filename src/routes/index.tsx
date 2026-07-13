import { Link, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import { useState, useEffect } from "react";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className={`mx-auto mt-3 sm:mt-4 flex max-w-5xl items-center justify-between rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-500 ${scrolled ? "bg-transparent border border-white/5 shadow-lg shadow-purple-500/5" : "glass"}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L11.5 7L17 7L12.5 10.5L14.5 16L10 12.5L5.5 16L7.5 10.5L3 7L8.5 7L10 2Z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">ElevateAI</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-400 transition-colors hover:text-white">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm text-gray-400 transition-colors hover:text-white">
              Testimonials
            </a>
            <a href="#faq" className="text-sm text-gray-400 transition-colors hover:text-white">
              FAQ
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <a href="/login" className="btn-demo animate-pulse-glow">
              Launch Demo
            </a>
            <a href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</a>
            <a href="/register" className="btn-primary text-xs px-4 py-2 hidden sm:inline-flex">
              Get started
            </a>
          </div>
        </div>
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
          className="quick-explore-card animate-fade-in w-full sm:w-auto justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3"
          style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: "both" }}
        >
          <span className="text-sm sm:text-base">{card.icon}</span>
          <span>{card.label}</span>
          <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
      <div className="absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] sm:h-[500px] sm:w-[500px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-1/4 right-0 h-[200px] w-[200px] sm:h-[300px] sm:w-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center pt-12 sm:pt-16 text-center">
          {/* Badge */}
          <div className="glass inline-flex animate-fade-in items-center gap-2 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-400">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
            AI-Powered Sales Coaching
          </div>

          {/* Headline */}
          <h1 className="mt-4 sm:mt-6 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            Turn Every Sales Call Into{" "}
            <span className="gradient-text-hero">a Coaching Opportunity</span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-gray-400">
            AI agents analyze calls, detect objections, grade performance, and
            deliver personalized coaching plans — automatically. No extra headcount
            required.
          </p>

          {/* Quick Explore Cards */}
          <QuickExploreCards />

          {/* CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-2 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0">
            <a href="/login" className="btn-demo-hero w-full sm:w-auto animate-pulse-glow">
              Launch Demo
            </a>
            <a href="/register" className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-5 sm:px-8 py-2.5 sm:py-4">
              Start free trial
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a href="#demo" className="btn-secondary w-full sm:w-auto justify-center text-sm sm:text-base px-5 sm:px-8 py-2.5 sm:py-4">
              Watch demo
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
          </div>

          {/* No signup required */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500">
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Sign in to access the full dashboard
          </p>

          {/* Hero Image */}
          <div className="mt-8 sm:mt-12 w-full max-w-5xl animate-fade-up">
            <div className="glass-card relative overflow-hidden rounded-xl sm:rounded-2xl p-1 sm:p-2 shadow-2xl">
              <img
                src="/hero-dashboard.png"
                alt="ElevateAI Dashboard"
                className="w-full rounded-xl"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-10 sm:mt-16 flex flex-col items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-gray-500">
              Trusted by leading sales teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-40 grayscale">
              {["Salesforce", "HubSpot", "ZoomInfo", "Outreach", "Gong"].map((name) => (
                <span key={name} className="text-sm sm:text-lg font-bold text-gray-400">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      title: "AI Call Analysis",
      description:
        "Every call is automatically transcribed, analyzed, and scored. AI identifies keywords, objection handling, talk-listen ratios, and compliance risks.",
      link: "/login",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      ),
      title: "Smart Scorecards",
      description:
        "Customizable scorecards to grade every rep on the metrics that matter. Track improvement over time with data-driven insights.",
      link: "/login",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      title: "Live Coaching",
      description:
        "Real-time AI suggestions during calls. Reps get live prompts for objection handling, next-best-action, and compliance reminders.",
      link: "/login",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      title: "AI Role-Playing",
      description:
        "Practice against AI-powered prospects. Reps sharpen skills with realistic scenarios tailored to your product and market.",
      link: "/login",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: "Manager Dashboards",
      description:
        "Full visibility into team performance, conversion trends, coaching ROI, and individual rep growth — all in one place.",
      link: "/login",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: "Team Collaboration",
      description:
        "Share best practices across the team. Managers assign coaching plans, track completion, and celebrate wins with leaderboards.",
      link: "/login",
    },
  ];

  return (
    <section id="features" className="relative py-16 sm:py-32">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-y-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="gradient-text text-xs sm:text-sm font-semibold uppercase tracking-widest">
            Features
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Everything You Need to Elevate Your Team
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-400">
            From AI-powered call analysis to live coaching and gamified learning —
            ElevateAI gives sales leaders the tools to build elite teams.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <a
              key={index}
              href={feature.link}
              className="glass-card group cursor-pointer rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 active:scale-[0.98]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-400 ring-1 ring-purple-500/20 transition-all duration-300 group-hover:from-purple-500/30 group-hover:to-indigo-600/30 group-hover:ring-purple-500/40">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{feature.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-purple-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
                Explore {feature.title}
                <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreviewSection() {
  return (
    <section id="dashboard-preview" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="gradient-text text-sm font-semibold uppercase tracking-widest">
            Dashboard Preview
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            See What's Behind the Login
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            A sneak peek at the powerful analytics and coaching tools that await your team.
          </p>
        </div>

        {/* Mockup */}
        <div className="mt-16 dashboard-preview-mockup">
          <div className="flex">
            {/* Sidebar Mockup */}
            <div className="mockup-sidebar hidden w-56 flex-shrink-0 p-4 sm:block">
              <div className="flex items-center gap-2 pb-6">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600" />
                <div className="h-3 w-20 rounded bg-white/10" />
              </div>
              {["Dashboard", "Calls", "Scorecards", "Coaching", "Analytics", "Team"].map((item, i) => (
                <div key={i} className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 ${i === 0 ? "bg-purple-500/20" : "hover:bg-white/10"}`}>
                  <div className={`h-2 w-2 rounded-full ${i === 0 ? "bg-purple-400" : "bg-white/30"}`} />
                  <span className={`text-xs ${i === 0 ? "font-medium text-purple-300" : "text-gray-400"}`}>{item}</span>
                </div>
              ))}
            </div>

            {/* Main Content Mockup */}
            <div className="flex-1 p-4 sm:p-6">
              {/* Stats Row */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="mockup-stat mockup-stat-primary">
                  <div className="h-2 w-16 rounded bg-purple-400/40 mb-2" />
                  <div className="h-6 w-12 rounded bg-purple-400/60" />
                  <div className="mt-1 h-2 w-20 rounded bg-green-400/30" />
                </div>
                <div className="mockup-stat">
                  <div className="h-2 w-16 rounded bg-white/20 mb-2" />
                  <div className="h-6 w-12 rounded bg-white/30" />
                  <div className="mt-1 h-2 w-20 rounded bg-white/10" />
                </div>
                <div className="mockup-stat">
                  <div className="h-2 w-16 rounded bg-white/20 mb-2" />
                  <div className="h-6 w-12 rounded bg-white/30" />
                  <div className="mt-1 h-2 w-20 rounded bg-white/10" />
                </div>
                <div className="mockup-stat">
                  <div className="h-2 w-16 rounded bg-white/20 mb-2" />
                  <div className="h-6 w-12 rounded bg-white/30" />
                  <div className="mt-1 h-2 w-20 rounded bg-white/10" />
                </div>
              </div>

              {/* Call List */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-white/20" />
                  <div className="h-6 w-20 rounded-full bg-purple-500/30" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-600/40" />
                      <div>
                        <div className="h-3 w-28 rounded bg-white/20" />
                        <div className="mt-1 h-2 w-20 rounded bg-white/10" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-12 rounded bg-green-400/40" />
                      <div className="h-2 w-10 rounded bg-white/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Annotation Labels */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Real-time Stats</p>
              <p className="mt-1 text-xs text-gray-500">Live call metrics, conversion rates, and team performance at a glance</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Call Transcripts</p>
              <p className="mt-1 text-xs text-gray-500">Full transcripts with AI analysis, sentiment scoring, and keyword detection</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scorecards</p>
              <p className="mt-1 text-xs text-gray-500">AI-powered grading with customizable rubrics and performance trends</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a href="/login" className="btn-primary text-base px-8 py-4">
            Explore the Dashboard
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="mt-3 text-sm text-gray-500">Sign in to access the full dashboard experience</p>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Core",
      price: "29",
      description: "For teams getting started with AI coaching",
      stripeLink: "https://buy.stripe.com/8x2fZh4pL2Tp1sY3kw1wY02",
      features: [
        "AI call analysis & transcription",
        "Basic scorecards",
        "Manager dashboards",
        "Up to 500 calls/month",
        "5 team members",
        "Email support",
      ],
      cta: "Subscribe now",
      popular: false,
    },
    {
      name: "Pro",
      price: "79",
      description: "For growing teams that want full AI coaching power",
      stripeLink: "https://buy.stripe.com/28E00jbSd79F1sYaMY1wY01",
      features: [
        "Everything in Core, plus:",
        "Live AI coaching during calls",
        "AI role-playing scenarios",
        "Custom scorecards & rubrics",
        "Up to 2,000 calls/month",
        "Unlimited team members",
        "Advanced analytics & reports",
        "Priority support",
      ],
      cta: "Subscribe now",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "199",
      description: "For large organizations with advanced needs",
      stripeLink: "https://buy.stripe.com/dRmd9Rf4p65B2x23kw1wY00",
      features: [
        "Everything in Pro, plus:",
        "Multi-company admin",
        "SSO & SAML",
        "Custom AI prompts & models",
        "Unlimited calls/month",
        "Dedicated success manager",
        "SLA guarantees",
        "Custom integrations",
        "On-premise deployment option",
      ],
      cta: "Subscribe now",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 right-0 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="gradient-text text-xs sm:text-sm font-semibold uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-400">
            Start with a free trial. No credit card required. Scale as you grow.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`glass-card relative rounded-2xl p-8 ${
                plan.popular ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">${plan.price}</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.stripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                    : "glass-light text-gray-200 hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          All plans include a 14-day free trial. Usage-based add-ons available for high-volume teams.
        </p>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "ElevateAI transformed our sales coaching process. We saw a 34% increase in conversion rates within the first quarter. The AI call analysis is incredibly accurate.",
      name: "Sarah Chen",
      role: "VP of Sales, TechFlow Inc.",
      avatar: "SC",
    },
    {
      quote:
        "The live coaching feature is a game-changer. Our reps perform better on every call with real-time AI guidance. It's like having a top-performing manager on every line.",
      name: "Marcus Johnson",
      role: "Director of Sales Development, CloudScale",
      avatar: "MJ",
    },
    {
      quote:
        "We've cut our onboarding time in half. New reps ramp up 2x faster with AI role-playing and personalized coaching plans. ROI was immediate and substantial.",
      name: "Emily Rodriguez",
      role: "Head of Revenue Enablement, DataVista",
      avatar: "ER",
    },
  ];

  return (
    <section id="testimonials" className="relative py-16 sm:py-32">
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="gradient-text text-xs sm:text-sm font-semibold uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Loved by Sales Leaders
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-400">
            See how ElevateAI is helping teams across industries achieve more.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card rounded-2xl p-6" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="flex gap-1 text-purple-400">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-300">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
        "Yes! Pro and Enterprise plans allow you to create custom scorecards with your own criteria, weighting, and grading rubrics. You can tailor them to your specific sales methodology and KPIs.",
    },
    {
      question: "Does ElevateAI integrate with my CRM?",
      answer:
        "Absolutely. ElevateAI integrates with Salesforce, HubSpot, and major dialers like Five9, RingCentral, Aircall, and Twilio. Enterprise plans include custom integrations.",
    },
    {
      question: "How does live coaching work?",
      answer:
        "During a live call, our AI listens in real-time and provides subtle prompts to the rep — objection responses, next-best-action suggestions, compliance reminders — displayed in a discreet overlay. Only the rep sees these prompts.",
    },
    {
      question: "What kind of ROI can I expect?",
      answer:
        "Our customers typically see 20-40% improvement in conversion rates, 2x faster ramp for new reps, and 30% reduction in coaching overhead. The average ROI is 5x within the first quarter.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. ElevateAI is SOC 2 Type II certified. All call data is encrypted at rest and in transit. Enterprise plans offer SSO/SAML, audit logs, and on-premise deployment options.",
    },
  ];

  return (
    <section id="faq" className="relative py-16 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="gradient-text text-xs sm:text-sm font-semibold uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 space-y-3 sm:space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="glass-card group rounded-2xl transition-all duration-300 open:bg-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-sm font-semibold text-white transition-colors hover:text-purple-400 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <svg className="h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-sm leading-relaxed text-gray-400">{faq.answer}</p>
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
      <div className="absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-8 lg:px-12">
        <div className="glass-card relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-indigo-600/10" />

          <div className="relative">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Elevate Your Sales Team?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
              Join hundreds of sales teams already using ElevateAI. Start your free trial today.
              No credit card required.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4">
              <a href="/register" className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-4">
                Start free trial
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a href="#features" className="btn-secondary text-base px-8 py-4">
                Learn more
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">14-day free trial · No credit card · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L11.5 7L17 7L12.5 10.5L14.5 16L10 12.5L5.5 16L7.5 10.5L3 7L8.5 7L10 2Z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">ElevateAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="transition-colors hover:text-gray-300">Features</a>
            <a href="#pricing" className="transition-colors hover:text-gray-300">Pricing</a>
            <a href="#testimonials" className="transition-colors hover:text-gray-300">Testimonials</a>
            <a href="#faq" className="transition-colors hover:text-gray-300">FAQ</a>
            <a href="#" className="transition-colors hover:text-gray-300">Privacy</a>
            <a href="#" className="transition-colors hover:text-gray-300">Terms</a>
          </div>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} ElevateAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Home() {
  const businessName = Route.useLoaderData();

  return (
    <div className="min-h-dvh bg-surface-950">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DashboardPreviewSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}