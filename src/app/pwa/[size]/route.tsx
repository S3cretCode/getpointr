import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }];
}

/** App icons generated at build time (no binary assets to manage). */
export async function GET(_req: Request, ctx: RouteContext<"/pwa/[size]">) {
  const { size } = await ctx.params;
  const n = [180, 192, 512].includes(Number(size)) ? Number(size) : 512;
  const ring = n * 0.5;
  const dot = n * 0.2;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FF6B1A",
        }}
      >
        <div
          style={{
            width: ring,
            height: ring,
            borderRadius: "50%",
            border: `${Math.round(n * 0.055)}px solid rgba(255,255,255,0.5)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#fff" }} />
        </div>
      </div>
    ),
    { width: n, height: n },
  );
}
