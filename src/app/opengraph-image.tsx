import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "XySpace Blog — Building in public";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#0A090E", color: "white", padding: "74px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", width: 740, height: 740, right: -210, top: -250, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,76,242,.82), rgba(71,27,142,.35) 38%, transparent 69%)" }} />
      <div style={{ position: "absolute", width: 360, height: 360, right: 130, top: 154, borderRadius: "46% 54% 54% 46% / 42% 48% 52% 58%", background: "radial-gradient(circle at 30% 25%, #fff 0%, #e1c9ff 8%, #a65ffc 27%, #4a168f 57%, #130621 100%)", boxShadow: "inset -30px -30px 45px rgba(3,0,12,.5), 0 0 78px rgba(140,65,245,.44)" }} />
      <div style={{ position: "absolute", width: 402, height: 402, right: 106, top: 134, borderRadius: "50%", border: "31px solid #211a2b", transform: "rotate(-28deg) skewY(-12deg)", boxShadow: "0 0 0 5px rgba(232,220,248,.23), inset 0 0 19px rgba(255,255,255,.16)" }} />
      <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 700, letterSpacing: -1 }}><span style={{ width: 29, height: 29, marginRight: 13, borderRadius: 10, background: "linear-gradient(135deg,#EAD9FF,#A36AFF 48%,#4A169A)" }} />XySpace <span style={{ color: "#b98bff", marginLeft: 8, fontWeight: 500 }}>Blog</span></div>
        <div style={{ marginTop: 116, fontSize: 72, letterSpacing: -4, fontWeight: 700, lineHeight: 0.96 }}>Building ideas<br />into <span style={{ color: "#C9AAFF", fontFamily: "Georgia, serif", fontWeight: 400 }}>momentum.</span></div>
        <div style={{ marginTop: 29, color: "#BBB4C5", fontSize: 24 }}>Progress notes from the workbench.</div>
      </div>
      <div style={{ position: "absolute", bottom: 55, left: 74, display: "flex", alignItems: "center", gap: 12, color: "#9B91A7", fontSize: 17, letterSpacing: 2 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: "#AA73FF", boxShadow: "0 0 16px #AA73FF" }} /> BUILDING IN PUBLIC</div>
    </div>,
    { ...size },
  );
}
