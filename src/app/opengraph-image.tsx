import { ImageResponse } from "next/og";

export const alt = "GetPointr: Point the way. Never take over.";
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
          background: "linear-gradient(135deg, #070B14 0%, #0E1628 60%, #2a1406 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(145deg, #FF8238 0%, #FF6414 55%, #D9480F 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white" }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, display: "flex" }}>
            Get<span style={{ color: "#FF6414" }}>Pointr</span>
          </div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, marginTop: 48, lineHeight: 1.05, display: "flex", flexDirection: "column" }}>
          <span>Point the way.</span>
          <span style={{ color: "#FF6414" }}>Never take over.</span>
        </div>
        <div style={{ fontSize: 30, marginTop: 32, color: "#CBD5E1", display: "flex" }}>
          Remote help without remote control. Scan to try the live demo.
        </div>
      </div>
    ),
    size,
  );
}
