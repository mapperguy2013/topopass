import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Resources",
  description:
    "Find TopoPass resources for TfL topographical map practice, SERU-style preparation support, and private hire learning links.",
  path: "/resources"
});

type Resource = {
  title: string;
  description: string;
  href?: string;
  external?: boolean;
};

const resourceCategories: {
  title: string;
  resources: Resource[];
}[] = [
  {
    title: "Official TfL links",
    resources: [
      {
        title: "TfL Topographical Assessment",
        description:
          "Official TfL information about the topographical assessment for private hire drivers.",
        href: "https://tfl.gov.uk/info-for/taxis-and-private-hire/licensing/topographical-assessment",
        external: true
      },
      {
        title: "TfL Taxi and Private Hire Licensing",
        description:
          "Official TfL licensing information for taxi and private hire drivers.",
        href: "https://tfl.gov.uk/info-for/taxis-and-private-hire/licensing",
        external: true
      },
      {
        title: "TfL Journey Planner",
        description:
          "Useful for understanding routes, transport links, and London geography.",
        href: "https://tfl.gov.uk/plan-a-journey/",
        external: true
      }
    ]
  },
  {
    title: "Map study materials",
    resources: [
      {
        title: "A-Z London street atlas",
        description:
          "Many candidates use a London A-Z style street atlas to practise map reading and location finding."
      },
      {
        title: "London boroughs and major areas",
        description:
          "Study London boroughs, major roads, stations, hospitals, airports, and landmarks."
      },
      {
        title: "Road restrictions and common route issues",
        description:
          "Learn about bridges, tunnels, restricted roads, and route planning considerations."
      }
    ]
  },
  {
    title: "SERU preparation support",
    resources: [
      {
        title: "SERU-style study themes",
        description:
          "Review safety, equality, accessibility, customer service, safeguarding, licensing rules, driver responsibilities, complaints, lost property, and regulatory awareness.",
        href: "/learn#seru-preparation"
      },
      {
        title: "Separate from topographical mocks",
        description:
          "SERU-style private hire knowledge is planned as a separate TopoPass learning area, not mixed into topographical map mock exams."
      },
      {
        title: "Original learning content",
        description:
          "TopoPass SERU support should use original public guidance-style learning content and must not copy official TfL questions."
      }
    ]
  },
  {
    title: "Video guides",
    resources: [
      {
        title: "Official TfL video guide",
        description:
          "An official video resource can be added after its current URL and relevance are verified."
      },
      {
        title: "Third-party route planning videos",
        description:
          "Third-party worked examples may be useful, but sources should be reviewed before being linked."
      },
      {
        title: "Assessment booking walkthroughs",
        description:
          "Booking guidance should always be checked against current official TfL information."
      }
    ]
  },
  {
    title: "TopoPass study tools",
    resources: [
      {
        title: "Practice questions",
        description:
          "Start a focused practice session using TopoPass question components.",
        href: "/practice"
      },
      {
        title: "Mock test",
        description:
          "Complete a mixed mock exam with knowledge, map-click, and route-drawing questions.",
        href: "/mock-test"
      },
      {
        title: "Mistake review",
        description:
          "Return to previous mistakes and prepare a more focused study plan.",
        href: "/review"
      }
    ]
  }
];

function ResourceCard({ resource }: { resource: Resource }) {
  const className =
    "group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-road/40 hover:shadow-soft";

  const content = (
    <>
      <h3 className="text-lg font-semibold text-ink group-hover:text-road">
        {resource.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {resource.description}
      </p>
      <p className="mt-5 text-sm font-semibold text-road">
        {resource.href ? "Open resource" : "Planned resource"}
      </p>
    </>
  );

  if (resource.external && resource.href) {
    return (
      <a
        className={className}
        href={resource.href}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  if (!resource.href) {
    return <article className={className}>{content}</article>;
  }

  return (
    <Link className={className} href={resource.href}>
      {content}
    </Link>
  );
}

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <section className="border-b border-slate-200 bg-white px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-road">
            Resource hub
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold text-ink sm:text-5xl">
            TfL topographical and SERU-style preparation resources
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            A curated set of useful links and study materials for private hire
            applicants preparing for topographical map skills and SERU-style
            private hire knowledge.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            TopoPass is an independent learning tool and is not affiliated with
            or endorsed by Transport for London.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto space-y-12 max-w-7xl">
          {resourceCategories.map((category) => (
            <section key={category.title}>
              <h2 className="text-2xl font-bold text-ink">{category.title}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.resources.map((resource) => (
                  <ResourceCard key={resource.title} resource={resource} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
