import { ImageResponse } from "next/og";
import { AppIconMark } from "@/components/AppIconMark";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppIconMark size={512} />, size);
}
