const disclaimer =
  "TopoPass is an independent learning tool and is not affiliated with, endorsed by, or sponsored by Transport for London, Uber, Bolt, FREENOW, or any private hire operator. Practice content is for preparation only; SERU-style questions are original learning questions, not official TfL questions. Learners should refer to official TfL guidance where appropriate.";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">TopoPass</p>
          <p className="mt-1 text-sm text-slate-600">
            Study tools for London private hire applicants.
          </p>
        </div>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          {disclaimer}
        </p>
      </div>
    </footer>
  );
}

export { disclaimer as independentStudyDisclaimer };
