import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailscale로 폰에서 dev 서버를 열 때 Next 16이 /_next/* 와 HMR 웹소켓을
  // cross-origin으로 판단해 403으로 막는 것을 방지한다.
  allowedDevOrigins: ["100.75.223.76", "npc.tail433877.ts.net"],
};

export default nextConfig;
