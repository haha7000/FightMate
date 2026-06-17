# FightMate 셋업 가이드 — Supabase + 소셜 로그인 연결

앱은 **키가 없으면 목데이터(데모)로, 키를 채우면 실제 DB+로그인으로** 자동 전환됩니다.
아래 3개를 발급받아 `.env.local`에 넣으면 됩니다. 순서대로 따라오세요.

---

## 1. Supabase 프로젝트 (DB + 로그인 + 스토리지)

1. https://supabase.com → 로그인 → **New project** 생성 (Region: **Northeast Asia (Seoul)** 추천)
2. 프로젝트가 만들어지면 **Project Settings → API Keys / Data API**에서 두 값 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 왼쪽 메뉴 **SQL Editor** → New query → 아래 두 파일을 **순서대로** 붙여넣고 실행(Run):
   1. `supabase/schema.sql` (테이블·보안정책 생성)
   2. `supabase/seed.sql` (체육관 6곳 + 리뷰 시드)

> 사진(체육관 이미지) 업로드까지 쓰려면: **Storage → New bucket** 으로 `gym-photos` 버킷을 Public으로 생성.
> (M2에서 연결. 지금은 데모 이미지 사용)

---

## 2. 카카오 로그인

1. https://developers.kakao.com → **내 애플리케이션 → 애플리케이션 추가하기**
2. **앱 키**에서 `REST API 키` 확인
3. **카카오 로그인** 메뉴 → **활성화 ON** → **Redirect URI** 등록:
   ```
   https://<당신의-supabase-url>.supabase.co/auth/v1/callback
   ```
   (정확한 주소는 아래 4번 Supabase 화면에 그대로 표시됨)
4. **동의항목**에서 닉네임 정도만 필수로 설정
5. **보안 → Client Secret** 생성(코드) → 값 복사

---

## 3. 구글 로그인

1. https://console.cloud.google.com → 프로젝트 생성
2. **APIs & Services → OAuth consent screen** 설정 (외부, 앱 이름 입력)
3. **Credentials → Create Credentials → OAuth client ID → Web application**
4. **Authorized redirect URIs**에 추가:
   ```
   https://<당신의-supabase-url>.supabase.co/auth/v1/callback
   ```
5. 생성된 **Client ID**와 **Client Secret** 복사

---

## 4. Supabase에 소셜 로그인 연결

Supabase 대시보드 → **Authentication → Sign In / Providers**:

- **Kakao** 활성화 → 2번의 REST API 키(Client ID)와 Client Secret 입력
- **Google** 활성화 → 3번의 Client ID와 Client Secret 입력
- 이 화면에 표시되는 **Callback URL**을 2·3번의 Redirect URI에 그대로 넣으면 됩니다.

또한 **Authentication → URL Configuration**:
- `Site URL`: 로컬은 `http://localhost:3000`, 배포 후엔 실제 도메인
- `Redirect URLs`에 `http://localhost:3000/**` 추가

---

## 5. 로컬에서 켜기

```bash
cp .env.local.example .env.local
# .env.local 에 1번에서 복사한 두 값 입력
npm run dev
```

- 키가 채워졌으면: 홈의 체육관이 DB에서 로드되고, 로그인 버튼이 실제 카카오/구글 창을 띄웁니다.
- 키가 비었으면: 그대로 데모 모드로 동작합니다.

---

## 6. 배포 (Vercel)

1. https://vercel.com → GitHub 저장소 연결 → Import
2. **Environment Variables**에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
3. 배포 후 도메인을 Supabase의 `Site URL` / `Redirect URLs`, 그리고 카카오·구글 Redirect URI에도 추가

---

## 참고: 무료 티어 일시정지 방지
Supabase 무료 프로젝트는 1주일간 요청이 없으면 일시정지됩니다.
배포 후 GitHub Actions로 하루 한 번 핑을 보내는 cron을 걸어두면 됩니다. (M2에서 설정)
