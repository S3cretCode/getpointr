import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#232830" />
          <path
            d="M 23.8 30.8 A 11.5 11.5 0 1 1 30.8 23.6"
            stroke="#78A3C8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="19.5" cy="19.5" r="4.4" fill="#F6F5F0" />
          <path
            d="M 23.4 23.4 L 31.8 26.5 L 28.4 28.0 L 31.3 30.9 L 29.5 32.7 L 26.6 29.8 L 25.1 33.2 Z"
            fill="#F6F5F0"
          />
        </svg>
      </div>
    ),
    size,
  );
}
