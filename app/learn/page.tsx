import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import {
  gettingStartedTips,
  learningPathSteps,
  lessonCards,
  learnSections,
  type LearnSkillType
} from "@/lib/learnContent";

export const metadata = buildPageMetadata({
  title: "Learn Topographical Skills And SERU Support",
  description:
    "Learn London map skills, route planning, topographical knowledge, mistake review, and SERU-style private hire preparation support.",
  path: "/learn"
});

const badgeStyles: Record<LearnSkillType, string> = {
  Knowledge: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Map Skills": "border-blue-200 bg-blue-50 text-blue-950",
  "Route Planning": "border-amber-200 bg-amber-50 text-amber-950",
  "Mock Exam": "border-purple-200 bg-purple-50 text-purple-950",
  Review: "border-rose-200 bg-rose-50 text-rose-950",
  SERU: "border-orange-200 bg-orange-50 text-orange-950"
};

function SkillBadge({ type }: { type: LearnSkillType }) {
  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${badgeStyles[type]}`}
    >
      {type}
    </span>
  );
}

function ActionLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road ${
        variant === "primary"
          ? "bg-road text-white hover:bg-blue-700"
          : "border border-slate-300 bg-white text-slate-700 hover:border-road hover:text-road"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

export default function LearnPage() {
  return (
    <AppShell title="Learn">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Learning hub
          </p>
          <h2 className="mt-2 max-w-4xl text-2xl font-bold text-ink sm:text-3xl">
            Build London private hire map confidence and SERU-style knowledge
            step by step
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700">
            Use this section to connect the app&apos;s learning tools: Learn
            explains the skill, Practice builds accuracy, Mock Exam tests mixed
            topographical performance, and Progress shows what to retry next.
            SERU preparation support is presented as a separate learning area.
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            TopoPass is independent and not affiliated with or endorsed by
            Transport for London. SERU-style questions are original learning
            questions for preparation, not official TfL questions.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {gettingStartedTips.map((tip) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                key={tip}
              >
                {tip}
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:flex-wrap">
            <ActionLink href="/practice">View all practice areas</ActionLink>
            <ActionLink href="/mock-test" variant="secondary">
              Try a mock exam
            </ActionLink>
            <ActionLink href="/progress/mistakes" variant="secondary">
              Review mistakes
            </ActionLink>
          </div>
        </section>

        <section
          aria-labelledby="recommended-learning-path"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Recommended learning path
          </p>
          <h2
            className="mt-2 text-2xl font-bold text-ink"
            id="recommended-learning-path"
          >
            Beginner to mock exam flow
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Follow the steps in order at first. Once you have progress history,
            use the recommendations and mistake list to choose the next focused
            practice area.
          </p>

          <ol className="mt-6 grid gap-4 lg:grid-cols-2">
            {learningPathSteps.map((step, index) => (
              <li
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                key={step.id}
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                    <Link
                      className="mt-3 inline-flex text-sm font-bold text-road hover:text-blue-700"
                      href={step.href}
                    >
                      {step.actionLabel}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="lesson-cards"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Focused lessons
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink" id="lesson-cards">
            Choose the skill you want to build
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lessonCards.map((lesson) => (
              <article
                className="flex min-h-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-4"
                key={lesson.id}
              >
                <SkillBadge type={lesson.skillType} />
                <h3 className="mt-4 text-lg font-bold text-ink">
                  {lesson.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {lesson.description}
                </p>
                <Link
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-road hover:text-road focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-road"
                  href={lesson.href}
                >
                  {lesson.actionLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6">
          {learnSections.map((section) => (
            <section
              aria-labelledby={`${section.id}-title`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
              key={section.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-road">
                    {section.eyebrow}
                  </p>
                  <h2
                    className="mt-2 text-2xl font-bold text-ink"
                    id={`${section.id}-title`}
                  >
                    {section.title}
                  </h2>
                </div>
                <SkillBadge type={section.skillType} />
              </div>

              <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-700">
                {section.description}
              </p>

              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {section.guidance.map((item) => (
                  <li
                    className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <ActionLink href={section.href}>{section.actionLabel}</ActionLink>
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
