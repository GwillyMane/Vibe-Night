import React from "react";
import type { PublicProfile } from "@/lib/profile/types";
import { activityLabel, formatActivityTime, formatJoinDate } from "@/lib/profile/profileUi";
import {
  PASSPORT_COLORS,
  PASSPORT_LAYOUT,
  PASSPORT_SIZE,
  avatarBorderStyle,
  heroShellStyle,
  tierChipStyle,
  titleColor,
} from "./themeTokens";
import { fitPassportUsername, passportUsernameMaxWidth } from "./passportTextFit";

export interface PassportLayoutProps {
  profile: PublicProfile;
  origin: string;
  profilePath: string;
  assets: import("./embedAssets").PassportEmbeddedAssets;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: PASSPORT_COLORS.muted,
      }}
    >
      {children}
    </span>
  );
}

function Chip({ label, value, accent, marginRight }: { label: string; value: string; accent?: string; marginRight?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 14,
        border: `1px solid ${PASSPORT_COLORS.border}`,
        background: PASSPORT_COLORS.card,
        marginRight: marginRight ?? 0,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: PASSPORT_COLORS.muted,
        }}
      >
        {label}
      </span>
      <span style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent ?? PASSPORT_COLORS.gold }}>{value}</span>
    </div>
  );
}

function MetaPill({ text, gold, marginRight }: { text: string; gold?: boolean; marginRight?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 14,
        paddingRight: 14,
        borderRadius: 999,
        border: gold ? "1px solid rgba(255,224,72,0.45)" : `1px solid ${PASSPORT_COLORS.border}`,
        background: PASSPORT_COLORS.card,
        fontSize: 13,
        fontWeight: 600,
        color: gold ? PASSPORT_COLORS.gold : "#e8e8e8",
        marginRight: marginRight ?? 8,
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  );
}

function FooterStat({
  label,
  value,
  accent,
  marginRight,
}: {
  label: string;
  value: string;
  accent?: string;
  marginRight?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 12,
        border: `1px solid ${PASSPORT_COLORS.border}`,
        background: PASSPORT_COLORS.card,
        marginRight: marginRight ?? 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: PASSPORT_COLORS.muted,
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          paddingTop: 8,
          fontSize: 16,
          fontWeight: 700,
          color: accent ?? PASSPORT_COLORS.white,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PassportUsername({
  username,
  maxWidth,
}: {
  username: string;
  maxWidth: number;
}) {
  const fit = fitPassportUsername(username, maxWidth);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: maxWidth,
      }}
    >
      {fit.lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            fontSize: fit.fontSize,
            fontWeight: 900,
            fontFamily: "Brice",
            textTransform: "uppercase",
            color: PASSPORT_COLORS.white,
            lineHeight: 1.08,
            letterSpacing: fit.letterSpacing,
            paddingTop: index > 0 ? 6 : 0,
            paddingBottom: index === fit.lines.length - 1 ? 4 : 0,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

export function PassportLayout({ profile, profilePath, assets }: PassportLayoutProps) {
  const shell = heroShellStyle(profile.themeId);
  const frame = avatarBorderStyle(profile.borderId);
  const tier = tierChipStyle(profile.arcadeTier);
  const stats = profile.stats;
  const highlights = profile.recentActivity
    .filter((item) => item.kind !== "passport_generated")
    .slice(0, 3);
  const statCellWidth = stats.length <= 6 ? 188 : 142;
  const bestCombo = stats.find((s) => s.id === "combo")?.value ?? "—";
  const usernameMaxWidth = passportUsernameMaxWidth(PASSPORT_LAYOUT.heroWidth, PASSPORT_LAYOUT.heroPadding);
  const avatarSize = PASSPORT_LAYOUT.avatarSize;

  return (
    <div
      style={{
        width: PASSPORT_SIZE.width,
        height: PASSPORT_SIZE.height,
        display: "flex",
        flexDirection: "column",
        background: PASSPORT_COLORS.bg,
        color: PASSPORT_COLORS.white,
        fontFamily: "Mundial",
        padding: PASSPORT_LAYOUT.padding,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: PASSPORT_LAYOUT.headerGap }}>
        <span style={{ fontSize: 13, letterSpacing: "0.35em", color: "rgba(255,224,72,0.55)", fontWeight: 700 }}>
          GOOD VIBES CLUB
        </span>
        <span
          style={{
            marginTop: 8,
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: "0.05em",
            color: PASSPORT_COLORS.gold,
            fontFamily: "Brice",
            textTransform: "uppercase",
          }}
        >
          Vibe Night Passport
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          gap: PASSPORT_LAYOUT.bodyGap,
          minHeight: 0,
        }}
      >
        {/* Identity column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: PASSPORT_LAYOUT.heroWidth,
            height: "100%",
            paddingTop: PASSPORT_LAYOUT.heroPadding,
            paddingBottom: PASSPORT_LAYOUT.heroPadding,
            paddingLeft: PASSPORT_LAYOUT.heroPadding,
            paddingRight: PASSPORT_LAYOUT.heroPadding,
            borderRadius: 20,
            background: shell.background,
            border: shell.border,
          }}
        >
          <PassportUsername username={profile.username} maxWidth={usernameMaxWidth} />

          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", paddingTop: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", marginRight: 16, flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "#121212",
                  border: frame.border,
                }}
              >
                <img src={assets.avatarSrc} alt="" width={avatarSize} height={avatarSize} style={{ objectFit: "cover" }} />
              </div>
              {assets.featuredSrc ? (
                <div
                  style={{
                    display: "flex",
                    marginTop: -40,
                    marginLeft: avatarSize - 48,
                    width: 48,
                    height: 48,
                  }}
                >
                  <img src={assets.featuredSrc} alt="" width={48} height={48} style={{ objectFit: "contain" }} />
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "row", paddingTop: 2 }}>
                <div
                  style={{
                    paddingTop: 5,
                    paddingBottom: 5,
                    paddingLeft: 10,
                    paddingRight: 10,
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: tier.border,
                    color: tier.color,
                    background: tier.background,
                  }}
                >
                  {profile.arcadeTier}
                </div>
              </div>
              <div
                style={{
                  paddingTop: 10,
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "Brice",
                  color: titleColor(profile.titleRarity),
                  lineHeight: 1.15,
                }}
              >
                {profile.equippedTitleLabel}
              </div>
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", paddingTop: 12 }}>
                <MetaPill text={`${profile.streak.currentStreak} day streak`} gold />
                {profile.favoriteGameLabel ? <MetaPill text={profile.favoriteGameLabel} /> : null}
                <MetaPill text={`Rank #${profile.vibeRank.toLocaleString()}`} marginRight={0} />
              </div>
            </div>
          </div>

          {assets.badgeSrcs.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "center",
                marginTop: 18,
                marginBottom: 18,
              }}
            >
              <SectionLabel>Pinned badges</SectionLabel>
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
                {assets.badgeSrcs.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    width={72}
                    height={72}
                    style={{ objectFit: "contain", marginRight: i < assets.badgeSrcs.length - 1 ? 14 : 0, marginBottom: 8 }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              borderTop: `1px solid ${PASSPORT_COLORS.border}`,
              paddingTop: 14,
            }}
          >
            <FooterStat label="Joined" value={formatJoinDate(profile.joinDate)} marginRight={10} />
            <FooterStat
              label="Best streak"
              value={`${profile.streak.longestStreak}d`}
              accent={PASSPORT_COLORS.gold}
              marginRight={10}
            />
            <FooterStat label="Best combo" value={bestCombo} accent={PASSPORT_COLORS.green} />
          </div>
        </div>

        {/* Stats column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "row", marginBottom: 16 }}>
            <Chip label="Achievements" value={String(profile.achievementCount)} marginRight={12} />
            <Chip label="Arcade tier" value={profile.arcadeTier} accent="#f5f5f5" marginRight={12} />
            <Chip label="Vibe rank" value={`#${profile.vibeRank.toLocaleString()}`} accent={PASSPORT_COLORS.pink} />
          </div>

          {stats.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <SectionLabel>Progression</SectionLabel>
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", marginTop: 12, alignContent: "stretch" }}>
                {stats.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      width: statCellWidth,
                      minHeight: 78,
                      paddingTop: 12,
                      paddingBottom: 12,
                      paddingLeft: 14,
                      paddingRight: 14,
                      borderRadius: 14,
                      border: `1px solid ${PASSPORT_COLORS.border}`,
                      background: PASSPORT_COLORS.card,
                      marginRight: (i + 1) % 4 === 0 ? 0 : 12,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: PASSPORT_COLORS.muted }}
                    >
                      {s.label}
                    </span>
                    <div style={{ marginTop: 5, fontSize: 22, fontWeight: 700, color: PASSPORT_COLORS.gold }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {highlights.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "auto",
                paddingTop: 14,
                borderTop: `1px solid ${PASSPORT_COLORS.border}`,
              }}
            >
              <SectionLabel>Recent highlights</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 10 }}>
                {highlights.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingLeft: 14,
                      paddingRight: 14,
                      borderRadius: 12,
                      border: `1px solid ${PASSPORT_COLORS.border}`,
                      background: PASSPORT_COLORS.card,
                      marginBottom: i < highlights.length - 1 ? 8 : 0,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#ececec" }}>{activityLabel(item)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: PASSPORT_COLORS.muted }}>
                      {formatActivityTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: `1px solid ${PASSPORT_COLORS.border}`,
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 12, color: PASSPORT_COLORS.muted }}>Check out my Vibe Night Passport</span>
          <span style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: PASSPORT_COLORS.gold }}>{profilePath}</span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,224,72,0.45)",
          }}
        >
          VIBE NIGHT
        </span>
      </div>
    </div>
  );
}
