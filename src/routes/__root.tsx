import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ElevateAI — Enterprise AI Sales Coaching Platform" },
      {
        name: "description",
        content:
          "Turn every sales call into a coaching opportunity. AI-powered call analysis, scorecards, live coaching, and personalized growth plans for enterprise sales teams.",
      },
      { name: "theme-color", content: "#0a0d1a" },
      { property: "og:title", content: "ElevateAI — Enterprise AI Sales Coaching Platform" },
      {
        property: "og:description",
        content:
          "AI agents analyze calls, grade performance, detect objections, and deliver personalized coaching plans automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ElevateAI — Enterprise AI Sales Coaching Platform" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-surface-950">
        {children}
        <Scripts />
      </body>
    </html>
  );
}