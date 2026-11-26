import { ImageResponse } from "next/og";

export const alt = "GetPointr — Point the way. Never take over.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link preview shown when the demo link is texted or shared. */
export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #060A14 0%, #0B1120 60%, #2a1406 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#FF6B1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white" }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, display: "flex" }}>
            Get<span style={{ color: "#FF6B1A" }}>Pointr</span>
          </div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 48, lineHeight: 1.05, display: "flex", flexDirection: "column" }}>
          <span>Point the way.</span>
          <span style={{ color: "#FF6B1A" }}>Never take over.</span>
        </div>
        <div style={{ fontSize: 30, marginTop: 32, color: "#94A3B8", display: "flex" }}>
          Remote help without remote control — scan to try the live demo.
        </div>
      </div>
    ),
    size,
  );
}
