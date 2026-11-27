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

/** Link preview shown when the website link is texted or shared. */
export default async function OpengraphImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 84px",
          background: "linear-gradient(135deg, #181C22 0%, #232830 58%, #263445 100%)",
          color: "#F6F5F0",
          fontFamily: fonts.length ? '"Plus Jakarta Sans"' : "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 740 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="68" height="68" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#232830" stroke="rgba(246,245,240,0.22)" strokeWidth="1.5" />
              <path
                d="M 23.8 30.8 A 11.5 11.5 0 1 1 30.8 23.6"
                stroke="#78A3C8"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <circle cx="19.5" cy="19.5" r="4.3" fill="#F6F5F0" />
              <path
                d="M 23.4 23.4 L 31.8 26.5 L 28.4 28.0 L 31.3 30.9 L 29.5 32.7 L 26.6 29.8 L 25.1 33.2 Z"
                fill="#F6F5F0"
              />
            </svg>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", display: "flex" }}>
              Get<span style={{ color: "#78A3C8" }}>Pointr</span>
            </div>
          </div>

          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginTop: 42,
              lineHeight: 1.05,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Point the way.</span>
            <span style={{ color: "#78A3C8" }}>Never take over.</span>
          </div>

          <div style={{ fontSize: 28, fontWeight: 500, marginTop: 28, color: "#DCE1E8", display: "flex" }}>
            Calm visual guidance with Privacy Shield. Scan or tap to try the live demo.
          </div>
        </div>

        {/* Large signature Gentle Beacon emblem on the right */}
        <div
          style={{
            width: 248,
            height: 248,
            borderRadius: 56,
            background: "#232830",
            border: "2px solid rgba(246,245,240,0.16)",
            boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="204" height="204" viewBox="0 0 40 40" fill="none">
            <path
              d="M 23.8 30.8 A 11.5 11.5 0 1 1 30.8 23.6"
              stroke="#78A3C8"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <circle cx="19.5" cy="19.5" r="4.2" fill="#F6F5F0" />
            <path
              d="M 23.4 23.4 L 31.8 26.5 L 28.4 28.0 L 31.3 30.9 L 29.5 32.7 L 26.6 29.8 L 25.1 33.2 Z"
              fill="#F6F5F0"
            />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length ? { fonts } : {}),
    },
  );
}
