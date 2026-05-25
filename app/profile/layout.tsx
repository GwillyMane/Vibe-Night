import type { ReactNode } from "react";



/** Profile routes sit on a fully opaque layer — never the inverted site doodle pattern. */

export default function ProfileLayout({ children }: { children: ReactNode }) {

  return (

    <div className="relative isolate min-h-[100dvh]">

      <div className="pointer-events-none fixed inset-0 z-0 bg-[#050505]" aria-hidden />

      <div className="relative z-[1]">{children}</div>

    </div>

  );

}


