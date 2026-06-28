# Phase 5 — 레거시 제거 (auth/Supabase/Cloudinary/Drizzle/listModal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대체물(Audius/Dexie/새 플레이어·라우트)이 모두 동작하는 상태에서, 더 이상 쓰이지 않는 인증·Supabase·Cloudinary·Drizzle·listModal·구 스토어/타입을 안전하게 제거한다.

**Architecture:** "제거 → 빌드/테스트 게이트" 사이클을 도메인별로 반복한다. 각 제거 태스크는 (1) 잔존 참조 0건 확인 → (2) 파일/의존성 삭제 → (3) `npm run build` + `npm test` 통과를 만족해야 한다.

**Tech Stack:** Next 16, TypeScript 6, Jest.

## Global Constraints

- 매 태스크 종료 시 `npm run build` 성공 + `npm test` 통과.
- **선행 조건**: Phase 1~4 완료(재생/검색/라이브러리/플레이어가 Audius+Dexie로 동작). 그렇지 않으면 본 계획을 시작하지 않는다.
- 제거 전 반드시 `git grep`으로 잔존 import 0건을 확인한 뒤 삭제한다(참조가 남아있으면 해당 참조부터 신규 경로로 이전).
- 환경변수(.env)의 Supabase/Cloudinary/Spotify 키 항목과 `middleware.ts`의 Supabase/Cloudinary 관련 CSP·헤더도 정리한다.
- 삭제는 되돌리기 쉽도록 도메인별 커밋으로 분리한다.

---

## File Structure (제거/수정 대상)

제거:
- `src/features/auth/*`, `src/shared/providers/authProvider.tsx`, `src/shared/lib/kakao.ts`
- `src/app/auth/*`, `src/app/api/supabase/*`, `src/app/api/users/*`, `src/app/api/cloudinary/*`
- `src/app/api/spotify/*`, `src/app/api/dataLoader.ts` (Cloudinary 로더)
- `src/widgets/listModal/*`, `src/features/listModal/*`
- `src/entities/User/*`, `src/entities/ToggleFavorite/*`
- `src/shared/db/dbConnection.ts`, `src/shared/db/schema.ts`, `src/shared/config/drizzle.config.ts`, `drizzle/`, `src/db/migrate.ts`(있으면)
- `src/app/store/cloudinaryStore.ts`, `src/app/store/favoriteStore.ts`, `src/app/store/recentPlayStore.ts`, `src/app/store/trackStore.ts`, `src/app/store/service/storeService.ts`(잔존분)
- `src/features/listModal/components/audioVisualizer.tsx`(Phase 4에서 이식 완료분)

수정:
- `package.json` — supabase/cloudinary/drizzle/postgres/kakao 의존성 + db 스크립트 제거
- `jest.setup.js` — supabaseClient mock 제거
- `jest.config.js` — `transformIgnorePatterns`의 `@supabase` 제거
- `next.config.ts` — `images.remotePatterns`의 cloudinary/scdn 제거
- `middleware.ts` — CSP/헤더의 supabase/cloudinary 정리
- `.env` — 미사용 키 제거
- `src/shared/types/dataType.ts` — 미사용 타입(Auth*/Cloudinary*/Spotify* 등) 정리

---

### Task 1: 인증(auth) 제거

**Files:**
- Remove: `src/features/auth/*`, `src/shared/providers/authProvider.tsx`, `src/shared/lib/kakao.ts`, `src/app/auth/*`
- Modify: 위를 import하던 파일(provider 트리, listModal 로그인 분기 등) — 단, listModal은 Task 4에서 통째 제거되므로 여기선 provider 트리만 정리

**Interfaces:**
- Consumes: 없음
- Produces: 인증 없는 provider 트리

- [ ] **Step 1: 잔존 참조 확인**

Run: `git grep -nE "authProvider|useAuthActions|features/auth|lib/kakao|app/auth" -- "src/" ":!src/widgets/listModal" ":!src/features/listModal"`
Expected: listModal 외 참조 목록. 각 참조를 제거(provider 트리에서 AuthProvider 제거 등). listModal 내부 참조는 Task 4에서 함께 사라지므로 무시.

- [ ] **Step 2: provider 트리에서 AuthProvider 제거**

`src/app/layout.tsx`(또는 provider 조립 위치)에서 `AuthProvider` 래핑을 제거한다.

- [ ] **Step 3: 파일 삭제**

```bash
git rm -r src/features/auth src/shared/providers/authProvider.tsx src/shared/lib/kakao.ts src/app/auth
```

- [ ] **Step 4: 의존성 제거**

```bash
npm uninstall @supabase/auth-helpers-nextjs kakao-js-sdk
```

- [ ] **Step 5: 빌드/테스트 게이트**

Run: `npm run build && npm test`
Expected: 성공/통과. 실패 시 잔존 import를 신규 경로로 정리. (auth 관련 테스트는 함께 삭제)

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: remove authentication (Supabase auth/Kakao OAuth)"
```

---

### Task 2: listModal 제거 (구 재생 UI 폐기)

**Files:**
- Remove: `src/widgets/listModal/*`, `src/features/listModal/*`
- Modify: `src/widgets/landing/index.tsx` (listModal/AudioPlayer 토글 제거)

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (구 모달 UI 제거; 재생은 Phase 4 미니플레이어/라우트가 담당)

- [ ] **Step 1: 잔존 참조 확인**

Run: `git grep -nE "widgets/listModal|features/listModal|ListModal" -- "src/"`
Expected: `src/widgets/landing/index.tsx` 등. 해당 참조 제거(랜딩에서 ListModal/토글 사용 부분 삭제 — 랜딩 자체 정리는 Phase 6).

- [ ] **Step 2: 파일 삭제**

```bash
git rm -r src/widgets/listModal src/features/listModal
```

- [ ] **Step 3: 빌드/테스트 게이트**

Run: `npm run build && npm test`
Expected: 성공/통과. (listModal 관련 테스트 `src/test/features/listModal/*`도 함께 삭제)

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: remove legacy listModal (replaced by routes + mini player)"
```

---

### Task 3: Cloudinary + Spotify 제거

**Files:**
- Remove: `src/app/api/cloudinary/*`, `src/app/api/spotify/*`, `src/app/api/dataLoader.ts`, `src/app/store/cloudinaryStore.ts`
- Modify: `next.config.ts`, `middleware.ts`, `.env`, 구 트랙 로딩 훅(`useAudioTrackManage` 등 Cloudinary 의존분)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 잔존 참조 확인**

Run: `git grep -nE "cloudinary|Cloudinary|spotify|Spotify|dataLoader" -- "src/"`
Expected: 참조 목록. Phase 4에서 신규 플레이어가 동작하므로 구 `useAudioTrackManage`(Cloudinary 맵 기반)·`cloudinaryStore` 사용처는 이미 대체됨 — 잔존 참조만 제거.

- [ ] **Step 2: 파일 삭제**

```bash
git rm -r src/app/api/cloudinary src/app/api/spotify src/app/api/dataLoader.ts src/app/store/cloudinaryStore.ts
```

- [ ] **Step 3: 설정 정리**

- `next.config.ts`: `images.remotePatterns`에서 `res.cloudinary.com`, `i.scdn.co` 제거(Audius/Deezer/위키 호스트 추가).
- `middleware.ts`: CSP `img-src`/`media-src`의 `*.supabase.co`/`*.cloudinary.com`를 Audius/Deezer 호스트로 교체, `Supabase-Auth-Token`/`apikey` 헤더 제거.
- `.env`: `SPOTIFY_*`, `CLOUDINARY_*` 키 제거.

- [ ] **Step 4: 의존성 제거**

```bash
npm uninstall cloudinary next-cloudinary
```

- [ ] **Step 5: 빌드/테스트 게이트**

Run: `npm run build && npm test`
Expected: 성공/통과.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: remove Cloudinary and Spotify integrations"
```

---

### Task 4: Drizzle/Supabase DB + 구 엔티티/스토어 제거

**Files:**
- Remove: `src/app/api/supabase/*`, `src/app/api/users/*`, `src/entities/User/*`, `src/entities/ToggleFavorite/*`, `src/shared/db/dbConnection.ts`, `src/shared/db/schema.ts`, `src/shared/config/drizzle.config.ts`, `drizzle/`
- Remove: `src/app/store/favoriteStore.ts`, `src/app/store/recentPlayStore.ts`, `src/app/store/trackStore.ts`, `src/app/store/service/storeService.ts`(잔존분)
- Modify: `package.json` (db 스크립트 + drizzle/postgres/supabase 의존성), `jest.setup.js`, `jest.config.js`

**Interfaces:**
- Consumes: 없음 (favorites/recent는 Phase 2 Dexie repo가 담당)
- Produces: 없음

- [ ] **Step 1: 잔존 참조 확인**

Run: `git grep -nE "drizzle|@vercel/postgres|supabase|favoriteStore|recentPlayStore|trackStore|storeService|entities/User|entities/ToggleFavorite|shared/db/schema|dbConnection" -- "src/"`
Expected: 참조 목록 0에 수렴해야 함. 남아있으면 신규 Dexie/도메인 경로로 이전 후 진행.

- [ ] **Step 2: 파일 삭제**

```bash
git rm -r src/app/api/supabase src/app/api/users src/entities/User src/entities/ToggleFavorite \
  src/shared/db/dbConnection.ts src/shared/db/schema.ts src/shared/config/drizzle.config.ts drizzle \
  src/app/store/favoriteStore.ts src/app/store/recentPlayStore.ts src/app/store/trackStore.ts \
  src/app/store/service/storeService.ts
```

- [ ] **Step 3: 설정 정리**

- `package.json`: `db:generate`/`db:migrate`/`db:studio` 스크립트 제거.
- `jest.setup.js`: `jest.mock("@/app/api/supabase/supabaseClient", ...)` 블록 제거.
- `jest.config.js`: `transformIgnorePatterns`에서 `@supabase` 토큰 제거.
- `.env`: `POSTGRES_*`/`SUPABASE_*` 키 제거.

- [ ] **Step 4: 의존성 제거**

```bash
npm uninstall @supabase/supabase-js drizzle-orm drizzle-kit @vercel/postgres postgres
```

- [ ] **Step 5: 빌드/테스트 게이트**

Run: `npm run build && npm test`
Expected: 성공/통과.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: remove Supabase/Drizzle DB layer and legacy stores/entities"
```

---

### Task 5: 미사용 타입/잔여물 정리 + 최종 검증

**Files:**
- Modify: `src/shared/types/dataType.ts` (Auth*/Cloudinary*/Spotify*/구 TrackInfo 등 미사용 타입 제거)
- Modify: `README.md` (스택에서 Supabase/Cloudinary/Drizzle 제거, Audius/Dexie 반영)
- Remove: 남은 구 테스트(`src/test/**`의 cloudinary/auth/supabase 의존분)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 미사용 타입 식별**

Run: `git grep -nE "AuthContextType|AuthStrategy|AuthProviderProps|CloudinaryResource|CloudinaryResourceMap|SpotifyTokenResponse|SpotifyError|CustomUserMetadata" -- "src/"`
Expected: 정의부(`dataType.ts`)만 남고 사용처 0건. 사용처가 0인 타입을 `dataType.ts`에서 제거.

- [ ] **Step 2: 타입/구 테스트 제거**

`dataType.ts`에서 미사용 타입을 삭제하고, 삭제된 모듈을 import하던 잔여 테스트 파일을 제거한다.

- [ ] **Step 3: 의존성 잔존 확인**

Run: `git grep -nE "@supabase|cloudinary|drizzle|postgres|kakao|@nextui-org" -- "src/" "package.json"`
Expected: 0건.

- [ ] **Step 4: 클린 설치 + 최종 빌드/테스트/스모크**

```bash
rm -rf node_modules .next
npm install
npm run build
npm test
```
Expected: 설치/빌드 성공, 테스트 통과. 이어 `npm run dev`로 홈/검색/트랙상세/보관함/재생 전 기능 동작 확인.

- [ ] **Step 5: README 갱신 + 커밋**

```bash
git add -A
git commit -m "chore: prune unused types and finalize legacy removal"
```

---

## Self-Review

**1. Spec 커버리지** (설계서 §4 제거 대상 + §12 5단계): auth→Task1; listModal→Task2; Cloudinary/Spotify→Task3; Supabase/Drizzle/구 스토어·엔티티→Task4; 미사용 타입/설정/잔여 테스트→Task5. 설계서 §4의 제거 파일 실경로를 모두 포함.
**2. Placeholder 스캔:** 각 단계가 구체 경로·명령·게이트를 명시. "잔존 참조 확인 후 제거"는 안전 삭제의 정당한 절차이며 grep 명령과 0건 기준을 구체화함 — placeholder 아님.
**3. 타입/명칭 일관성:** 제거 대상 경로가 앞선 탐색에서 확인된 실제 파일과 일치. favorites/recent 기능은 Phase 2 Dexie repo가 대체하므로 구 store 제거 후에도 기능 공백 없음. CSP/이미지 호스트는 Phase 1(Audius/Deezer)·Phase 6과 정합.

**범위 주의:** Phase 5 전용. 반드시 Phase 1~4 완료 후 시작. 연출/번들 최적화는 Phase 6.
