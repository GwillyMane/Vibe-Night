import { PROFILE_PAGE_SHELL } from "@/lib/profile/profileStyles";

export default function ProfileLoading() {
  return (
    <div className={PROFILE_PAGE_SHELL}>
      <main className="relative mx-auto max-w-lg animate-pulse px-4 pb-8 pt-5 sm:max-w-xl">
        <div className="mb-5 flex justify-between rounded-2xl border border-[#1F1F1F] bg-[#0a0a0a] px-3 py-2.5">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-10 w-28 rounded-xl bg-white/10" />
        </div>
        <div className="rounded-2xl border border-[#1F1F1F] bg-[#0a0a0a] p-6">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 rounded-2xl bg-[#121212]" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-40 rounded bg-white/10" />
              <div className="h-4 w-32 rounded bg-white/8" />
              <div className="flex gap-2">
                <div className="h-7 w-24 rounded-full bg-[#121212]" />
                <div className="h-7 w-20 rounded-full bg-[#121212]" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-7 space-y-3">
          <div className="h-3 w-28 rounded bg-gvc-gold/20" />
          <div className="rounded-2xl border border-[#1F1F1F] bg-[#0a0a0a] p-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 min-w-[7.75rem] rounded-xl bg-[#121212]" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
