import { type PropsWithChildren } from "react"

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <aside className="relative flex flex-col justify-center gap-12 overflow-hidden bg-linear-to-br from-brand-navy via-brand-azure to-brand-teal px-6 py-8 text-white lg:w-[48%] lg:shrink-0 lg:px-12 lg:py-14">
        <div>
          <h2 className="font-sans text-3xl font-bold">WHITE CASTLE</h2>
          <p className="mt-2 font-ibm-plex text-base text-white/80">
            Motel &middot; Eldoret
          </p>
        </div>

        <div className="hidden max-w-md lg:block">
          <h2 className="font-heading text-5xl leading-[1.08] font-extrabold tracking-tight text-balance capitalize">
            Every room, every guest, every shilling.
          </h2>
          <p className="mt-6 text-base/7 text-pretty text-white/80">
            Approve a request, check someone in, see what the week earned
            without leaving the desk.
          </p>
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center bg-porcelain px-4 py-12 dark:bg-background">
        <div className="w-full max-w-102">{children}</div>
        <small className="absolute bottom-4 text-slate-800/60">
          &copy; {new Date().getFullYear()} White Castle Motel, Eldoret. All
          rights reserved.
        </small>
      </main>
    </div>
  )
}
