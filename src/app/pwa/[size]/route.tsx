import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "180" }, { size: "192" }, { size: "512" }];
}

/** App icons generated at build time matching the Gentle Beacon charcoal + dusty-blue mark. */
export async function GET(_req: Request, ctx: RouteContext<"/pwa/[size]">) {
  const { size } = await ctx.params;
  const n = [180, 192, 512].includes(Number(size)) ? Number(size) : 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#232830",
        }}
      >
        <svg width={Math.round(n * 0.86)} height={Math.round(n * 0.86)} viewBox="0 0 40 40" fill="none">
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
      </div>
    ),
    { width: n, height: n },
  );
}
