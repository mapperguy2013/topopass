import Link from "next/link";
import { NewsletterSignupForm } from "@/src/components/newsletter/NewsletterSignupForm";

const disclaimer =
  "TopoPass is an independent learning tool and is not affiliated with or endorsed by Transport for London. SERU-style questions are original learning questions and are not official TfL questions.";

const footerGroups = [
  {
    title: "Prepare",
    links: [
      { href: "/topographical", label: "Topographical Assessment" },
      { href: "/seru", label: "SERU Assessment" },
      { href: "/practice", label: "Practice" },
      { href: "/mock-test", label: "Mock Tests" },
      { href: "/progress", label: "Progress" }
    ]
  },
  {
    title: "Learn",
    links: [
      { href: "/learn", label: "Map skills" },
      { href: "/practice/routes", label: "Route planning" },
      { href: "/practice/knowledge", label: "Location knowledge" },
      { href: "/practice/seru", label: "SERU-style topics" },
      { href: "/resources", label: "Resources" }
    ]
  },
  {
    title: "Account",
    links: [
      { href: "/auth/log-in", label: "Sign in" },
      { href: "/practice", label: "Start practising" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing", label: "Upgrade coming soon" },
      { href: "/progress", label: "Progress dashboard" }
    ]
  },
  {
    title: "Information",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/disclaimer", label: "Disclaimer" }
    ]
  }
] as const;

const socialNames = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "X / Twitter",
  "LinkedIn"
] as const;

function SocialIcon({ name }: { name: string }) {
  return (
    <button
      aria-label={`${name} coming soon`}
      className="inline-flex size-10 cursor-not-allowed items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-xs font-bold text-slate-400"
      disabled
      title={`${name} coming soon`}
      type="button"
    >
      {name
        .replace(" / Twitter", "")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </button>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-ink px-6 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Link
              className="inline-flex min-h-11 items-center gap-3 rounded-md text-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              href="/"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-white text-sm font-bold text-ink">
                TP
              </span>
              <span>TopoPass</span>
            </Link>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              A structured preparation course for London private hire learners
              building confidence with topographical skills and SERU-style
              knowledge.
            </p>
            <p className="mt-4 text-sm text-slate-300">
              Contact:{" "}
              <a
                className="font-semibold text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                href="mailto:support@topopass.co.uk"
              >
                support@topopass.co.uk
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              TopoPass, London, United Kingdom
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
            <h2 className="text-lg font-bold">Get TopoPass updates</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Be the first to hear about new Topographical and SERU-style
              practice features, launch updates, and pricing news.
            </p>
            <NewsletterSignupForm />
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <nav aria-label={group.title} key={group.title}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      className="inline-flex rounded-md py-1 text-sm text-slate-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-700 pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-300">
              © 2026 TopoPass. All rights reserved.
            </p>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-400">
              {disclaimer}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Social links">
            {socialNames.map((name) => (
              <SocialIcon key={name} name={name} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export { disclaimer as independentStudyDisclaimer };
