import { ImageResponse } from "next/server";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        role="img"
        aria-label="Serdar Salim Domurcuk logo"
      >
        <defs>
          <radialGradient id="sd-glow" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffd6a8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#fb923c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="#0f172a" />
        <circle cx="32" cy="32" r="24" fill="url(#sd-glow)" />
        <text
          x="32"
          y="38"
          textAnchor="middle"
          fontFamily="'Inter', 'Segoe UI', sans-serif"
          fontSize="18"
          fontWeight="600"
          fill="#fff7ed"
        >
          SD
        </text>
      </svg>
    ),
    {
      width: size.width,
      height: size.height,
    }
  );
}
