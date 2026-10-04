import { redirect } from "next/navigation";

// 예전 관리자 화면 주소 → 관장 모드로 이동
export default function AdminRedirect() {
  redirect("/partner");
}
