"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  PROFILE_PANEL,
  PROFILE_PANEL_BODY,
  PROFILE_PANEL_HEADER,
  PROFILE_SECTION_SUB,
  PROFILE_SECTION_TITLE,
} from "@/lib/profile/profileStyles";

interface ProfileSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
}

export function ProfileSection({ title, subtitle, children, delay = 0 }: ProfileSectionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7 first:mt-6"
    >
      <div className={PROFILE_PANEL}>
        <div className={PROFILE_PANEL_HEADER}>
          <h2 className={PROFILE_SECTION_TITLE}>{title}</h2>
          {subtitle ? <p className={PROFILE_SECTION_SUB}>{subtitle}</p> : null}
        </div>
        <div className={PROFILE_PANEL_BODY}>{children}</div>
      </div>
    </motion.section>
  );
}
