import { ImageResponse } from "next/og";
import { meta } from "@/content/copy";
import { PIXEL_HEART } from "@/lib/shapes/heart";

export const alt = meta.description;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The link preview: a glowing pixel heart on a plum night. No names. */
export default function OpengraphImage() {
  const cell = 26;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 42%, #8c1456 0%, #3d0f2e 38%, #12040e 75%)",
          color: "#fff0f7",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", filter: "drop-shadow(0 0 28px rgba(255,20,147,0.8))" }}>
          {PIXEL_HEART.map((row, y) => (
            <div key={y} style={{ display: "flex" }}>
              {row.split("").map((c, x) => (
                <div
                  key={x}
                  style={{
                    width: cell,
                    height: cell,
                    margin: 2,
                    borderRadius: 3,
                    background: c === "1" ? (x + y < 6 ? "#ff8dc7" : "#ff1493") : "transparent",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 56, fontSize: 52, letterSpacing: 1, display: "flex", alignItems: "center" }}>
          {meta.ogLine.replace("♡", "").trim()}
          <svg width="44" height="40" viewBox="0 0 24 22" style={{ marginLeft: 18 }}>
            <path d="M12 21 C5 15 1 11.5 1 7 C1 3.5 3.6 1 7 1 C9.2 1 11 2.2 12 4 C13 2.2 14.8 1 17 1 C20.4 1 23 3.5 23 7 C23 11.5 19 15 12 21 Z" fill="none" stroke="#ff8dc7" strokeWidth="2" />
          </svg>
        </div>
        <div style={{ marginTop: 16, fontSize: 22, letterSpacing: 10, color: "#ff8dc7", display: "flex" }}>13 · 10</div>
      </div>
    ),
    size
  );
}
