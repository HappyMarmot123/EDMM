# EDMM 대규모 개편 설계서

- 작성일: 2026-06-23
- 대상: EDMM (Electronic Dance Music Marmot) — Next.js 음악 스트리밍 웹앱
- 목표: **실사용 가능한 음악 제품**으로 전환 (성능 문제 + 부실한 컨텐츠 해소)
- 핵심 제약: **키 없이 사용 가능한 API만 사용**, **Supabase/Cloudinary/Drizzle deprecate**, **OAuth/인증 제거**, **데이터는 Dexie(IndexedDB) 로컬 우선**

---

## 1. 배경과 문제 정의

1년 전 1인 개발로 만들어진 프로젝트. FSD 아키텍처와 다수의 디자인 패턴(Presentation/Container, Adapter, Compound, HOC, Factory, Facade 등)이 잘 구현되어 있으나 두 가지 문제가 있다.

- **부실한 컨텐츠**: 실제 트랙이 Cloudinary에 업로드한 소수 파일 + Spotify는 미리듣기(preview_url) 메타데이터뿐. 도메인 모델도 `users`, `favorites` 두 테이블로 매우 얇다.
- **성능 문제**: 사실상 단일 페이지(`app/page.tsx → widgets/landing`). 랜딩이 화려한 연출(cobe 3D 지구본, lenis 스무스 스크롤, lottie, 다중 패럴랙스)을 한 화면에 몰아 초기 번들/렌더 비용이 큼.

### 해결 전략

- 콘텐츠 소스를 **Audius(풀트랙 스트리밍)** + Deezer/MusicBrainz/lyrics.ovh/Wikipedia(메타·가사·아티스트)로 교체 → 콘텐츠 문제 근본 해소.
- 단일 페이지를 **멀티 라우트**로 분리 + 연출 지연 로딩 → 초기 번들 축소, 성능 개선.
- 백엔드/키 의존(Supabase·Cloudinary) 제거 → **로컬 우선(Dexie)** 으로 키 없이 즉시 동작.

### 의식적 트레이드오프

- 백엔드가 없으므로 데이터는 기기 단위 저장. **멀티기기 동기화·소셜(팔로우/댓글)·결제는 범위에서 제외**한다. 추후 동기화 어댑터를 열어둘 여지만 남긴다.

---

## 2. 기술 스택 결정

### 유지/계승
- Next.js (App Router) · React · TypeScript · Tailwind · Framer Motion
- Zustand(클라 상태) · TanStack Query(서버 상태) · Jest/RTL(테스트)
- Web Audio API 싱글톤(`src/shared/lib/audioInstance.ts`) · 오디오 비주얼라이저 자산

### 신규 도입
- **Dexie / dexie-react-hooks** — IndexedDB 로컬 우선 저장소
- 외부 API 클라이언트: Audius, Deezer, MusicBrainz, lyrics.ovh, Wikipedia REST, TheAudioDB(test key)

### 제거(deprecate)
- `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`
- `cloudinary`, `next-cloudinary`
- `drizzle-orm`, `drizzle-kit`, `@vercel/postgres`, `postgres`
- `kakao-js-sdk` (OAuth 제거)
- `@nextui-org/react` (소스 미사용 — 죽은 의존성)

---

## 3. 0단계 — 기술 스택 버전업 & 마이그레이션 (선행)

방식: **점진적 업그레이드(앱 항상 green)**. 메이저는 1건씩 올리고 매번 `npm run build` + `npm test` 통과를 검증 게이트로 삼는다. 정확한 breaking change는 추정하지 않고 **공식 업그레이드 가이드 + codemod 실행 + 빌드/테스트 결과**로 확인한다.

### 3.1 업그레이드 매핑 (레지스트리 확인값, 2026-06-23 기준)

| 패키지 | 현재 | 목표 | 위험도 |
|---|---|---|---|
| next | 15.3.1 | 16.2.9 | 메이저 |
| eslint-config-next | 15.3.1 | 16.x | 메이저 |
| typescript | ^5 | 6.0.3 | 메이저 |
| eslint | ^9 | 10.5.0 | 메이저 |
| react / react-dom | ^19.0.0 | 19.2.7 | 마이너 |
| tailwindcss / @tailwindcss/postcss | ^4.1.5 | 4.3.1 | 마이너 |
| framer-motion | ^12.9.4 | 12.40.0 | 마이너 |
| zustand | ^5.0.4 | 5.0.14 | 패치 |
| @tanstack/react-query | ^5.80.7 | 5.101.1 | 마이너 |
| sonner | ^2.0.5 | 2.0.7 | 패치 |
| lucide-react | ^0.507.0 | 1.21.0 | 메이저(아이콘 import 회귀 확인) |
| swiper | ^11.2.6 | 12.2.0 | 메이저 |
| cobe | ^0.6.3 | 2.0.1 | 메이저(지구본 `useEarth.ts` 회귀 확인) |

### 3.2 0단계 진행 순서

1. **죽은/불필요 의존성 제거**: `@nextui-org/react`, `kakao-js-sdk` 삭제. (Supabase/Cloudinary/Drizzle은 *교체 대상*이라 여기서 제거하지 않음 — 4·6단계에서 대체물과 함께 제거.)
2. **저위험 마이너/패치 일괄 업그레이드**: react/react-dom, tailwind, framer-motion, zustand, react-query, sonner → build/test 통과.
3. **메이저 1건씩**: Next 16 (`npx @next/codemod`) → TS 6 → ESLint 10(+config-next 16) → lucide 1 → swiper 12 → cobe 2. 각 단계마다 build/test 게이트.
4. `npm test` 전체 통과 + `npm run build` 성공 + 로컬 수동 스모크(랜딩/재생) 확인으로 0단계 종료.

### 3.3 검증 게이트
- `npm run build` 성공
- `npm test` 통과 (기존 테스트 회귀 없음)
- 개발 서버에서 랜딩 렌더 + 트랙 1곡 재생 스모크

---

## 4. FSD 레이어 재편 (목표 구조)

```
app/
  ├── page.tsx                 → views/home
  ├── search/page.tsx          → views/search
  ├── track/[id]/page.tsx      → views/trackDetail
  ├── artist/[id]/page.tsx     → views/artist
  ├── playlist/[id]/page.tsx   → views/playlist
  ├── library/page.tsx         → views/library
  ├── layout.tsx               (전역 + 미니플레이어 고정)
  ├── loading.tsx / error.tsx / not-found.tsx
  ├── api/                     외부 API 프록시(route handlers)
  │   ├── audius/  deezer/  lyrics/  musicbrainz/  wiki/
  │   └── (제거) supabase/  users/  cloudinary/
  └── store/                   Zustand: playerStore, queueStore, uiStore
                               (favoriteStore/recentPlayStore → Dexie repo로 교체)

views/        (신설) 페이지 조립 레이어: home, search, trackDetail, artist, playlist, library
widgets/      audioPlayer(계승), trackList, queuePanel, lyricsPanel, navSidebar
              (제거: listModal — 라우트 페이지로 대체)
features/     player, search, library(favorite/playlist/recent), discover, lyrics, audioEngine
              (제거: auth/*)
entities/     Track, Artist, Album, Playlist (도메인 모델 + 어댑터)
              (제거: User, ToggleFavorite의 Supabase 쿼리 — favorites는 Dexie로)
shared/       api(외부 클라이언트), db(dexie), lib(audioInstance 계승), ui, hooks, types
```

> FSD 단방향 의존성·슬라이스 public API(`index.ts` 배럴) 규칙은 그대로 준수한다. `widgets`에 페이지 조립이 섞여 비대해지는 것을 막기 위해 페이지 조립 전용 `views` 레이어를 신설한다.

### 제거 대상 파일/디렉터리 (코드베이스 실경로)
- `src/features/auth/*` (useAuthActions, protectTooltip)
- `src/shared/providers/authProvider.tsx`, `src/shared/lib/kakao.ts`
- `src/app/auth/*`, `src/app/api/supabase/*`, `src/app/api/users/*`, `src/app/api/cloudinary/*`
- `src/widgets/listModal`, `src/features/listModal/*` (로그인/인증 분기 포함)
- `src/entities/User/*`, `src/entities/ToggleFavorite/*Query.ts`, `*Schema.ts`
- `src/shared/db/dbConnection.ts`, `src/shared/config/drizzle.config.ts`, `drizzle/`
- `src/app/store/cloudinaryStore.ts`

---

## 5. 외부 API 통합 — 어댑터 패턴

각 API 응답 형태가 제각각이므로 **Adapter로 공통 도메인 모델로 정규화**한다. 기존 `UnifiedTrack` 타입과 Adapter 패턴 자산을 계승한다.

### 5.1 도메인 모델 (entities)

```ts
// entities/Track
interface Track {
  id: string;            // "audius:abc123" 처럼 소스 prefix
  source: "audius" | "deezer";
  title: string;
  artistId: string;
  artistName: string;
  albumName?: string;
  artworkUrl: string;
  durationMs: number;
  streamUrl?: string;    // Audius: 재생 가능 URL / Deezer: 30초 preview
  metadata: Record<string, unknown>;
}
interface Artist { id; name; imageUrl?; bio?; }
interface Album  { id; title; artworkUrl; artistName; trackIds; }
interface Playlist { id; name; trackIds; createdAt; } // 로컬 전용
```

### 5.2 API 역할 분담 (전부 키 불필요)

| API | 역할 | 키 | 호출 방식 |
|---|---|---|---|
| **Audius** (`api.audius.co`) | **풀트랙 스트리밍**, 트렌딩, 검색 | 없음 | 호스트 디스커버리 후 `/v1/tracks/...`, 스트림 `/v1/tracks/{id}/stream` |
| **Deezer** (`api.deezer.com`) | 검색 보강, 30초 preview, 고화질 아트워크 | 없음 | route 프록시(CORS 대응) |
| **MusicBrainz** | 릴리즈/아티스트 관계 메타 | 없음 | route 프록시(User-Agent 필수, 1req/s 레이트리밋) |
| **lyrics.ovh** | 가사 | 없음 | `/v1/{artist}/{title}` |
| **Wikipedia REST** | 아티스트 바이오 | 없음 | `/api/rest_v1/page/summary/{title}` |
| **TheAudioDB** | 아티스트 이미지/바이오 보강 | test key("2") | 보조 |

### 5.3 호출 경로
- 모든 외부 호출은 **Next.js route handler 프록시**(`app/api/*`)를 경유한다. 이유: CORS 회피, User-Agent/레이트리밋 헤더 제어, 응답 정규화 위치 일원화.
- 클라이언트는 TanStack Query로 호출. `staleTime`/`gcTime`를 소스별로 튜닝. 재생 소스는 항상 **Audius**(풀트랙), Deezer는 메타/미리듣기 보강용.

---

## 6. 데이터 레이어 — Dexie 로컬 우선

### 6.1 스키마

```ts
// shared/db/edmmDB.ts
class EDMMDatabase extends Dexie {
  favorites!:      Table<{ id?: number; trackId: string; addedAt: number }>;
  playlists!:      Table<{ id?: number; name: string; createdAt: number }>;
  playlistTracks!: Table<{ id?: number; playlistId: number; trackId: string; order: number }>;
  recentPlays!:    Table<{ id?: number; trackId: string; playedAt: number }>;
  trackCache!:     Table<{ trackId: string; payload: Track; cachedAt: number }>;
}
// stores 정의
//   favorites: '++id, &trackId, addedAt'
//   playlists: '++id, name, createdAt'
//   playlistTracks: '++id, playlistId, trackId, order'
//   recentPlays: '++id, trackId, playedAt'
//   trackCache: 'trackId, cachedAt'
```

### 6.2 이행
- 기존 `src/app/store/favoriteStore.ts`, `recentPlayStore.ts`(Zustand) → **Dexie repository + `useLiveQuery`** 기반으로 교체.
- 기존 낙관적 업데이트 로직(`OptimisticFavoriteState`/`Action`, `useFavoriteAction.ts`)은 Dexie 트랜잭션 위로 **이식**한다.
- `trackCache`는 도메인 `Track` 스냅샷을 저장해 재방문 시 외부 API 없이 즉시 표시.

---

## 7. 플레이어 / 큐

- `playerStore`(현재 트랙·재생상태·진행) + `queueStore`(목록·shuffle·repeat) 분리. (기존 `audioInstanceStore`, `trackStore`, `recentPlayStore` 정리·재구성)
- **미니플레이어**: 전역 `layout.tsx` 하단 고정. 라우트 이동 간 재생 유지(싱글톤 오디오 인스턴스 덕분에 자연스럽게 가능).
- **전체 플레이어**: 라우트/오버레이로 전환. 기존 `features/audio`(desktop/mobile, seek, controls, albumArtwork) 자산 이식.
- 재생 소스 = Audius 스트림 URL. 기존 `useAudioTrackManage`, `useAudioPlayControl` 훅 로직 계승·정리.

---

## 8. 오디오 엔진 — 기존 자산 계승·확장 (P0)

> 사용자가 공들여 만든 영역. **비주얼라이저는 보완·개선**, **크로스페이드·EQ는 기존 Web Audio 싱글톤 위에 노드 체인을 확장해 신규 구현**한다.

### 8.1 현재 상태 (정확)
- `src/shared/lib/audioInstance.ts`: 싱글톤 그래프 `source(MediaElementSource) → analyser → destination`. 단일 오디오 엘리먼트 + analyser(fftSize 512).
- `audioVisualizer.tsx`: canvas segmented-bar 시각화 (구현됨, 코드 내 "펌핑효과" TODO 미완).
- **크로스페이드·이퀄라이저: 코드에 없음** (GainNode/BiquadFilter 부재).

### 8.2 목표 그래프
```
audioA → sourceA → gainA ┐
                          ├→ [EQ: BiquadFilter low/mid/high] → analyser → destination
audioB → sourceB → gainB ┘
```

- **크로스페이드**: 싱글톤을 **듀얼 오디오 엘리먼트(A/B) + GainNode** 관리 구조로 리팩터링. 트랙 전환 시 `gainA.linearRampToValueAtTime(0)` / `gainB →1` 램프. 크로스페이드 길이는 설정값.
- **이퀄라이저**: `source→analyser` 사이에 BiquadFilter 체인 삽입(저/중/고역 + 확장 밴드). 프리셋(EDM/Bass/Vocal/Flat) 제공, 설정은 Dexie 저장.
- **비주얼라이저 개선**: 기존 canvas 로직 유지 + 펌핑효과 완성, 반응형 크기, 라우트 플레이어와 연동, 새 EQ 후단 analyser 신호 반영.

### 8.3 호환 주의
- `createMediaElementSource`는 엘리먼트당 1회만 생성 가능 → 듀얼 소스는 각 엘리먼트마다 독립 source/gain을 둔다.
- 자동재생 정책상 `AudioContext.resume()`는 사용자 상호작용에서만 호출(기존 주석 정책 유지).

---

## 8.5 디자인 시스템 — Neon Glassmorphism (정체성 보존)

비주얼 정체성: **다크 밤하늘 + 로즈톤 핑크 별 낙하 배경 + cobe 지구본 + 다이나믹 애니메이션**. 스타일은 **Neon Glassmorphism**으로 통일하되 기존 정체성(`#ff98a2` 로즈톤, 별 낙하, 지구본)을 보존·강화한다.

- **토큰화**: 흩어진 하드코딩(`#ff98a2`, `.snow`, 글로우)을 Tailwind v4 `@theme` + CSS 변수의 시맨틱 토큰으로 승격(색/글래스 표면/네온 글로우/타이포/간격/반경/z-index/모션).
- **글래스 프리미티브**: `GlassCard`, `Button`(primary/ghost), `IconButton`(aria-label·44px), `Slider`, `Skeleton`을 `shared/ui`에 캡슐화. Phase 3·4 UI가 이를 소비.
- **모션 시스템**: Framer Motion variants(`fadeInUp`/`stagger`/`scalePress`/`pageTransition`)를 토큰화(150–300ms, transform·opacity, ease-out 진입/ease-in 퇴장, 퇴장<진입, stagger 30–50ms). `prefers-reduced-motion` 존중.
- **앱 배경**: 별 낙하 + 그라데이션 backdrop를 전역 셸로, 지구본은 홈 hero에서 유지.
- **접근성(CRITICAL)**: 글래스 표면 위 본문 대비 ≥ 4.5:1, 포커스 링 보존, 아이콘 버튼 라벨, reduced-motion. (ui-ux-pro-max 우선순위 1~3·7 기준)
- **배치**: 디자인 시스템은 UI를 본격 구현하는 라우트/플레이어 단계보다 **먼저** 토대를 잡는다(아래 마이그레이션 순서의 D단계).

---

## 9. 페이지 맵 & 우선순위

| 라우트 | 페이지 | 우선순위 | 핵심 콘텐츠 |
|---|---|---|---|
| `/` | 홈/디스커버 | P0 | Audius 트렌딩/장르/추천 |
| `/search` | 통합 검색 | P0 | 트랙/아티스트/앨범, 무한스크롤(기존 `useInfiniteScroll` 재활용) |
| `/track/[id]` | 트랙 상세 | P0 | 가사(lyrics.ovh) + 관련곡 |
| `/artist/[id]` | 아티스트 | P1 | 인기곡 + 바이오(Wikipedia/MB) |
| `/playlist/[id]` | 플레이리스트 | P1 | 로컬 플레이리스트(Dexie) |
| `/library` | 보관함 | P1 | 좋아요/최근/플레이리스트 |
| `/genre/[tag]` | 장르 | P2(보류) | 디스커버에 흡수 가능 |
| (제외) `/events` | 이벤트 | 컷 | 키리스 이벤트 API 빈약 |

---

## 10. 성능 설계

- 랜딩 연출(cobe·lenis·lottie·다중 패럴랙스) → `dynamic import` + `IntersectionObserver` 지연 로딩 + 인트로 `sessionStorage` 1회화.
- 단일 거대 페이지 → 라우트 분리로 초기 번들 축소, 각 페이지 `loading.tsx`.
- 외부 API: 소스별 `staleTime`/`gcTime` 튜닝 + `trackCache`(Dexie)로 재방문 즉시 표시.
- 이미지 `next/image` 최적화 유지(WebP/리사이즈/지연 로딩).

---

## 11. 테스트 전략

기존 Jest/RTL 구조 유지. 우선 단위 테스트 대상:
- **어댑터(정규화)**: 각 API 응답 → 도메인 모델 변환.
- **Dexie repository**: favorites/playlist/recent CRUD + 낙관적 업데이트.
- **오디오 엔진**: 크로스페이드 램프 계산, EQ 프리셋 적용(노드 그래프는 모킹).
- 외부 API는 모킹. 기존 테스트(`src/test/**`)는 제거 대상(auth/listModal/cloudinary) 정리 + 신규 구조로 재배치.

---

## 12. 마이그레이션 순서 (전체)

```
0단계  툴체인 버전업 (점진적, green 유지)
1단계  외부 API 어댑터 + route 프록시 (Audius 우선) — 도메인 모델 확정
2단계  Dexie 도입 — favorite/recent를 Dexie repo로 이식 (Supabase 쿼리 대체)
D단계  디자인 시스템 (Neon Glassmorphism 토큰·프리미티브·모션·배경) — UI 구현 전 토대
3단계  라우트/페이지 골격 (home·search·track·library) + views 레이어 (D단계 프리미티브 소비)
4단계  플레이어 라우트화(미니/전체) + 오디오 엔진 확장(크로스페이드·EQ·비주얼라이저)
5단계  auth/Supabase/Cloudinary/Drizzle 제거 (listModal·auth 폐기, 대체 완료 후)
6단계  성능 패스 (연출 지연 로딩, 번들 축소, 캐싱 튜닝)
```

각 단계는 독립적으로 build/test 통과를 유지한다. D단계(디자인)는 라우트/플레이어(3·4단계)보다 먼저 토대를 잡아 컴포넌트를 두 번 만들지 않게 한다. 5단계 제거는 반드시 대체물(Audius/Dexie)이 동작한 뒤 수행한다.

---

## 13. 범위 밖 (Non-goals)

- 멀티기기 동기화, 클라우드 백업
- 소셜(팔로우/댓글/공유 피드), 사용자 인증/계정
- 결제·구독
- 공연/이벤트 페이지(1차)
