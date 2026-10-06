import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 순수 로직 단위 테스트 (날짜·검증·변환). 화면 테스트가 필요해지면 jsdom + Testing Library 추가.
export default defineConfig({
  resolve: {
    tsconfigPaths: true, // tsconfig의 @/ 경로 별칭 (Vite 내장)
    alias: {
      // server-only는 서버 번들 밖에서 import하면 예외를 던진다 — 테스트에선 빈 모듈로
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // 서버 로직·API·데이터 계층 기준 (화면 컴포넌트는 E2E로 볼 영역이라 제외)
      include: ["src/lib/**/*.ts", "src/app/**/route.ts", "src/proxy.ts"],
      exclude: ["src/**/*.test.ts", "src/lib/database.types.ts", "src/lib/mock-data.ts", "src/lib/supabase/**"],
      reporter: ["text-summary", "text"],
    },
  },
});
