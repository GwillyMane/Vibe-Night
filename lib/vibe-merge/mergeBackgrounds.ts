/** Play-area backgrounds shipped in /public/Big Vibes/ */
export interface MergeBackgroundDef {
  id: string;
  label: string;
  /** Path under public/ (folder name has a space). */
  src: string;
}

const BG_DIR = "/Big Vibes";

function bgPath(filename: string): string {
  return encodeURI(`${BG_DIR}/${filename}`);
}

export const MERGE_BACKGROUNDS: MergeBackgroundDef[] = [
  {
    id: "chill-vibes-guy",
    label: "Chill Vibes",
    src: bgPath("ChillVibesGuy_Floating.jpg"),
  },
  {
    id: "craig-car-wink",
    label: "Craig Car",
    src: bgPath("CraigCarWink.jpg"),
  },
  {
    id: "gvc-duck",
    label: "GVC Duck",
    src: bgPath("GVC_Duck_002.jpg"),
  },
  {
    id: "vibe-foot-hammock",
    label: "Hammock Vibes",
    src: bgPath("VibefootHammock.jpg"),
  },
];

export const DEFAULT_MERGE_BACKGROUND_ID = MERGE_BACKGROUNDS[0]!.id;

export function getMergeBackgroundById(id: string): MergeBackgroundDef {
  return MERGE_BACKGROUNDS.find((b) => b.id === id) ?? MERGE_BACKGROUNDS[0]!;
}

const cache = new Map<string, HTMLImageElement>();

export function preloadMergeBackgrounds(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return Promise.all(
    MERGE_BACKGROUNDS.map(
      (bg) =>
        new Promise<void>((resolve) => {
          if (cache.has(bg.id)) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            cache.set(bg.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = bg.src;
        })
    )
  ).then(() => undefined);
}

export function getMergeBackgroundImage(id: string): HTMLImageElement | undefined {
  return cache.get(id) ?? cache.get(DEFAULT_MERGE_BACKGROUND_ID);
}
