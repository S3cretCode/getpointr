import { ImageResponse } from "next/og";

export const alt = "GetPointr: Point the way. Never take over.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_500_URL =
  "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_m07NSg.ttf";
const FONT_800_URL =
  "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KUnNSg.ttf";

async function loadFonts() {
  try {
    const [medium, extraBold] = await Promise.all([
      fetch(FONT_500_URL).then((r) => (r.ok ? r.arrayBuffer() : null)),
      fetch(FONT_800_URL).then((r) => (r.ok ? r.arrayBuffer() : null)),
    ]);
    const fonts: { name: string; data: ArrayBuffer; weight: 500 | 800; style: "normal" }[] = [];
    if (medium) fonts.push({ name: "Plus Jakarta Sans", data: medium, weight: 500, style: "normal" });
    if (extraBold) fonts.push({ name: "Plus Jakarta Sans", data: extraBold, weight: 800, style: "normal" });
    return fonts;
  } catch {
    return [];
  }
}

/** Link preview shown when the demo link is texted or shared. */
export default async function OpengraphImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #070B14 0%, #0E1628 60%, #2a1406 100%)",
          color: "white",
          fontFamily: fonts.length ? '"Plus Jakarta Sans"' : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10.5" fill="#FF6414" />
            <rect
              x="0.75"
              y="0.75"
              width="34.5"
              height="34.5"
              rx="9.75"
              stroke="white"
              strokeOpacity="0.26"
              strokeWidth="1.5"
            />
            <path
              d="M9.5 22.5A9.5 9.5 0 1 1 23.2 9.9"
              stroke="white"
              strokeOpacity="0.55"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <circle cx="16.5" cy="16.5" r="4.2" fill="white" />
            <path
              d="M21.2 21.2L29.2 24.1L25.4 25.8L23.7 29.6L21.2 21.2Z"
              fill="white"
              stroke="#C23A08"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", display: "flex" }}>
            Get<span style={{ color: "#FF6414" }}>Pointr</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginTop: 44,
            lineHeight: 1.04,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Point the way.</span>
          <span style={{ color: "#FF6414" }}>Never take over.</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 500, marginTop: 32, color: "#CBD5E1", display: "flex" }}>
          Remote help without remote control. Scan to try the live demo.
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length ? { fonts } : {}),
    },
  );
}
