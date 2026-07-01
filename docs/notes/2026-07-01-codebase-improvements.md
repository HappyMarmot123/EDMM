# EDMM 코드베이스 개선 문서

- 작성일: 2026-07-01
- 상태: 상세 작성 완료 (구현 전)
- 대상: EDMM — Next.js 16 / React 19 / Zustand / Dexie 음악 웹앱 (**Cloudinary** 콘텐츠 소스)
- 절차: 기획설계 → 코드베이스 기반 구체화 → 문서검토 → Task 분리 → 구현진행(X). **본 문서는 구현을 포함하지 않는다.** 구현은 **Codex에게 이전**하며 **새 feature 브랜치를 생성해** 진행한다(§7).
- 관계 문서: [`docs/specs/2026-06-23-edmm-revamp-design.md`](../specs/2026-06-23-edmm-revamp-design.md) (대규모 개편 설계서)

> ⚠️ **전제 정정 (중요).** 개편 설계서는 콘텐츠 소스를 Cloudinary → Audius로 교체(Phase 1)하려 했으나, **실제로는 Audius를 도입하지 않았고 Cloudinary를 유일한 소스로 유지 중**이다. 따라서 본 문서에서 Cloudinary는 *제거 대상 레거시가 아니라 유지·개선 대상*이며, `TrackSource = "cloudinary"`(단일 소스)는 현 시점에서 정상이다. Audius 등 외부 소스 교체는 **범위 밖**(§6).

> 이 문서는 기존 초안(“코드베이스 개선 메모”)의 진단을 검증·확장하고, 코드베이스 전수 조사 결과를 병합한 정식본이다.

---

## 1. 개요 & 목표

### 1.1 범위 (In scope)

개편 설계서와 **별개로**, 지금 존재하는 코드에 대한 개선만 다룬다. 대부분 즉시 장애가 아닌 **선제적 리팩터링/유지보수성** 항목이며, 버그로 확정된 것은 소수다.

1. **기술부채 / 레거시 정리** — 죽은 코드·설정 잔재, 미완 마이그레이션 흔적.
2. **코드 품질 / 일관성** — 이중 모델(`TrackInfo` vs `Track`), 중복 타입, 거대 모듈, 배럴 규칙 불일치, 로깅 seam 부재, 문자열 이벤트 버스.
3. **성능 / 번들** — 지연 로딩 부재, 초기 번들 비용.
4. **테스트 / 안정성** — 커버리지 게이트 부재, ESLint 안전 규칙 비활성화.

### 1.2 범위 밖 (Non-goals)

- 신규 기능 추가(플레이리스트 UI 확장, 가사 패널 등).
- 개편 설계서에서 이미 확정된 방향의 재논의.
- 오디오 노드 체인 확장(gain/EQ/크로스페이드) — 개편 설계 Phase 4로 위임.
- **구현**: 본 문서는 진단과 Task 분리까지만 수행한다.

### 1.3 원칙

- 모든 개선 항목은 **근거(파일:라인)** 를 동반한다. 추정만으로 기재하지 않는다.
- 각 Task는 **build/test green을 유지**하며 독립 병합 가능해야 한다.
- 우선순위: **P0**(위험/일관성 붕괴) · **P1**(품질·성능 실효) · **P2**(있으면 좋음).

---

## 🔄 현행화 상태 (2026-07-01 재검증) — 다수 항목 이미 해결

문서 작성 이후 코드가 크게 진전되어 아래 다수가 **해결/부분해결**되었다. 본문(§3)의 file:line은 **작성 시점 기준**이며(예: `dataType.ts`는 현재 삭제됨), 현황은 이 표를 우선한다.

| 항목 | 상태 | 근거(현재 코드) |
|---|---|---|
| A1 deprecated 오브 렌더 | ✅ 해결 | `DeprecatedRoseHeroOrbit` 렌더 0건 |
| B2 `AudioCapabilities` 중복 | ✅ 해결 | `audioInstance.ts:31` 단일 정의만 |
| B4 `audio.src` SSOT | ✅ 해결 | provider가 src 미설정 → 엔진(`audioInstance.ts`)으로 중앙화 |
| B6 `console.*` | ✅ 대부분 해결 | ~30 → **2건** |
| B7 문자열 이벤트 버스 | ✅ 해결 | `edmm:*` **0건** |
| B9 `dataType.ts` junk-drawer | ✅ 해결 | **파일 삭제**, `shared/providers/audioPlayerTypes.ts`로 분리 |
| C3 서버 Data Cache | ✅ 해결 | `cloudinaryClient.ts` `revalidateTag`(`:131`)·`next:{revalidate}`(`:195`) |
| D1 `coverageThreshold` | ✅ 해결 | `jest.config.js`에 존재 |
| B1 이중 트랙 모델 | 🟡 부분 | `TrackInfo` 13→**11**파일, `entities/track` 21→**34** |
| B5 거대 provider | 🟡 부분 | 702→**544**줄, 타입 `audioPlayerTypes.ts` 분리 |
| B10 배럴 규칙 | 🟡 부분 | `entities/track`·`features/audio`·`features/library`·`shared/db` 배럴 추가됨. artist/album/landing·shared(hooks·lib·api·components) **미도입** |
| C1 `next/dynamic` | 🟡 부분 | 0→**1건** |
| C2 img→`next/image` | 🟡 부분 | eslint-disable 5→**2건** |
| B8 시드 지문 이원화 | ❌ 잔존 | `buildTrackSeedFingerprint`·`normalizeArtworkForFingerprint` 3참조 |
| D2 eslint 안전규칙 off | ❌ 잔존 | `no-explicit-any`·`no-console`·`prefer-const` 등 여전히 off |

> **잔여 실질 과제**: B1 마무리 · B5 추가 분해 · B10 잔여 슬라이스 · B8 · D2. 나머지(A1·B2·B4·B6·B7·B9·C3·D1)는 완료. §5 Task 표의 우선순위는 이 현황에 맞춰 재조정 필요(T1·T3·T15 등 상당수 완료).

---

## 2. 먼저, 좋은 점 (유지할 강점)

- `.env*` gitignore 처리로 시크릿 노출 없음.
- **`@ts-ignore` / `@ts-expect-error` 0건**, `as any` 0건 — 타입 우회가 없다.
- `eslint-disable`는 5건뿐이며 **모두 정당한** `@next/next/no-img-element`(동적 CDN 호스트 아트워크). 남용 아님.
- TODO/FIXME 사실상 없음(주석형 문서 노트 제외).
- 테스트 47개로 커버리지 양호, FSD 계층 규율 준수.
- 오디오 부수효과를 Provider 한 곳(`audioPlayerProvider`)에 격리 — 단, 그로 인해 비대해짐(§3 B5).

---

## 3. 현행 코드베이스 진단 & 개선 항목

### 진단 요약표

| #   | 영역   | 항목                                           | 우선순위 | 핵심 근거                                                  |
| --- | ------ | ---------------------------------------------- | -------- | ---------------------------------------------------------- |
| A1  | 레거시 | `deprecatedRoseHeroOrbit` 여전히 렌더          | P1       | `landingHero.tsx:4,43`                                     |
| A2  | 레거시 | ESLint ignore `drizzle/**` 잔재                | P2       | `eslint.config.mjs:19`                                     |
| A3  | 레거시 | 미연결 데드코드(`labs/youtube-alt` 등)         | P2       | 아래 A3                                                    |
| A4  | 레거시 | 오디오 그래프 단일 소스(gain/EQ 없음) — 진단만 | P2       | `audioInstance.ts:66-73`                                   |
| B1  | 품질   | 이중 트랙 모델 `TrackInfo` ↔ `Track`           | **P0**   | `dataType.ts:6-13`, `entities/track/model.ts:3-14`         |
| B2  | 품질   | `AudioCapabilities` 이중 정의                  | **P0**   | `dataType.ts:21-26`, `audioInstance.ts:15-20`              |
| B3  | 품질   | `playTrack` 반환 타입 `void`인데 실제 async    | P1       | `dataType.ts:69-73`                                        |
| B4  | 품질   | `audio.src` 이중 관리(SSOT 위반)               | **P0**   | `audioPlayerProvider.tsx:366,393,553`                      |
| B5  | 품질   | 거대 모듈(`audioPlayerProvider` 702줄 등)      | P1       | wc -l                                                      |
| B6  | 품질   | 로깅 seam 부재 — 원시 `console.*` ~30개        | P1       | `audioInstance.ts` 외                                      |
| B7  | 품질   | 문자열 커스텀 이벤트 버스                      | P1       | `edmm:*` 6곳                                               |
| B8  | 품질   | 시드 지문 로직 이원화                          | P1       | `musicShell/index.tsx:288`, `useMusicShellTrackSeed.ts:34` |
| B9  | 품질   | `dataType.ts` 183줄 junk-drawer                | P1       | `dataType.ts` 전체                                         |
| B10 | 품질   | 배럴(public API) 규칙 불일치                   | P1       | views/widgets만 `index.ts`                                 |
| C1  | 성능   | `next/dynamic` 사용처 0 — 연출 즉시 로딩       | P1       | grep 0건                                                   |
| C2  | 성능   | 플레이어 아트워크 raw `<img>`(next/image 우회) | P2       | eslint-disable 5곳                                         |
| C3  | 성능   | 서버 Data Cache 미활용(`no-store`) — track 장기 캐싱 부재 | P1 | `cloudinaryClient.ts:205,10-15,150-152`                    |
| D1  | 테스트 | jest `coverageThreshold` 게이트 없음           | P1       | `jest.config.js`                                           |
| D2  | 테스트 | ESLint 안전 규칙 다수 off                      | P1       | `eslint.config.mjs:44-51`                                  |

항목 형식: **문제 / 근거 / 제안 / 리스크**.

### A. 기술부채 / 레거시 정리

#### A1. `deprecatedRoseHeroOrbit`가 프로덕션에 계속 렌더됨 — P1

- **문제**: “Cobe로 교체 중 임시 보존”이라 주석된 컴포넌트가 히어로에서 실제 렌더되고 번들에도 포함.
- **근거**: `features/landing/ui/deprecatedRoseHeroOrbit.tsx:5`(주석), `landingHero.tsx:4`(import)·`:43`(렌더), 전용 테스트 존재.
- **제안**: Cobe 오브(`landingCobeOrbit`)가 대체 완료했는지 확인 후 렌더 제거 → 컴포넌트/테스트 삭제. 아직 필요하면 정식 이름으로 승격(둘 중 택1).
- **리스크**: 낮음(시각 회귀만 스모크).

#### A2. ESLint ignore의 `drizzle/**` 잔재 — P2

- **문제**: Drizzle은 소스에서 제거됐으나(`grep drizzle`=0) 린트 ignore에 잔존.
- **근거**: `eslint.config.mjs:19`. `drizzle/` 디렉터리 부재. `:22` `src/shared/config/eslint.config.mjs` 참조도 실재 여부 점검 필요.
- **제안**: ignore 항목 및 죽은 config 참조 정리.
- **리스크**: 없음.

#### A3. 미연결 데드코드 판단 — P2

- **문제**: 라우트/조립에 연결되지 않은 자산이 존재.
- **근거**: `src/app/labs/youtube-alt/`는 **빈 디렉터리**(파일 없음). `views/library` 및 `favorites`/`playlists` repo의 실사용 연결 상태 확인 필요(현재 `musicShell`/`trackList`가 library를 참조).
- **제안**: 활성화 계획 없으면 제거, 있으면 문서에 “예정” 명시. `labs/youtube-alt` 빈 디렉터리는 즉시 삭제.
- **리스크**: 낮음(제거 전 참조 grep 확인).

#### A4. 오디오 그래프 단일 소스 — 진단만 — P2

- **문제**: `source → analyser → destination` 뿐이라 크로스페이드/EQ 확장 여지 없음.
- **근거**: `audioInstance.ts:66-73`.
- **제안**: **진단만 기록.** 노드 체인 확장은 개편 설계 Phase 4로 위임(중복 구현 방지).
- **리스크**: 해당 없음.

### B. 코드 품질 / 일관성

#### B1. 이중 트랙 모델 — `TrackInfo`(레거시) ↔ `Track`(도메인) — **P0**

- **문제**: 정규화 도메인 모델 `Track`과 Cloudinary 형태 레거시 뷰모델 `TrackInfo`(`assetId/album/name/artworkId/url/producer`)가 동시에 흐른다. 스토어가 둘을 혼용: `setTrack(track: TrackInfo)` vs `playTrack(track: Track)`.
- **근거**: `shared/types/dataType.ts:6-13`(`TrackInfo`)·`:58-83`(혼용), `entities/track/model.ts:3-14`(`Track`). 사용량 `TrackInfo` 13파일 / `entities/track` 21파일. 플레이어 UI가 `TrackInfo` 의존(`features/audio/ui/audioPlayer.tsx:15`).
- **제안**: `Track`을 단일 진실원으로 확정, `TrackInfo`는 **어댑터 경계에서만** 파생하는 뷰모델로 격하/제거. 변환 함수는 `entities/track`에 콜로케이트.
- **리스크**: 중. 플레이어 전 경로 영향 → 어댑터 단위 테스트로 방어하며 점진 치환.

#### B2. `AudioCapabilities` 이중 정의 — **P0**

- **문제**: 동일 형태 타입이 두 곳에 정의되어 drift 위험.
- **근거**: `dataType.ts:21-26`, `audioInstance.ts:15-20`.
- **제안**: 한 곳에서 export, 다른 쪽은 재-export만.
- **리스크**: 낮음.

#### B3. `playTrack` 반환 타입 `void` vs 실제 async — P1

- **문제**: 인터페이스는 `=> void`인데 구현은 비동기 로직(경쟁조건 `requestId` 포함) → 호출부가 `await` 못 하는 오해 유발.
- **근거**: `dataType.ts:69-73`(`playTrack: (...) => void`), 구현 `audioPlayerProvider.tsx:289-336`.
- **제안**: 실제 계약에 맞춰 `=> void | Promise<void>` 또는 `Promise<void>`로 정정(B1 모델 정리와 함께).
- **리스크**: 낮음.

#### B4. `audio.src` 이중 관리 — SSOT 위반 — **P0**

- **문제**: 재생 소스 `audio.src`가 두 경로에서 설정되어 단일 진실원 위반. `if (audio.src !== url)` 가드로 방어 중이나 재생 로직 변경 시 회귀 위험 큼.
- **근거**: `audioPlayerProvider.tsx:366`·`:393`(`playTrack` 내부), `:553`(동기화 effect, `:552` 가드). 초안에서도 “결합도 최상위”로 지목.
- **제안**: `audio.src` 설정을 **단일 지점**(예: 동기화 effect)으로 일원화하고, `playTrack`은 의도(트랙/큐)만 상태로 커밋. B5 분해와 함께 처리.
- **리스크**: 중. 재생 핵심 → 동작 동치 테스트 필수.

#### B5. 거대 모듈 — `audioPlayerProvider.tsx`(702줄) 외 — P1

- **문제**: 단일 파일이 오디오 수명주기·재생 제어·큐·셔플·아트워크 복구·캐시/최근재생을 모두 떠안음. `playTrack` 하나가 ~140줄.
- **근거**: `audioPlayerProvider.tsx` 702줄, `musicShell/index.tsx` 478줄, `trackDetailAside.tsx` 344줄, `musicTrackList.tsx` 311줄.
- **제안**: 책임 단위 훅 추출 — `useArtworkRecovery`, `useQueueControls`, `usePlaybackSync`(B4의 src 일원화 지점) 등. Provider는 조립만.
- **리스크**: 중~높음. 기존 `audioPlayerProvider.test.tsx`를 안전망으로, brainstorming으로 범위 확정 + TDD 권장.

#### B6. 로깅 seam 부재 — 원시 `console.*` ~30개 — P1

- **문제**: repo 계층은 `NODE_ENV !== "production"` 가드가 있으나 `audioInstance.ts`엔 없어 정보성 로그가 프로덕션에도 출력.
- **근거**: `audioInstance.ts:47,75,88,92,98,127,140`(가드 없음), `httpClient.ts:50,54`, `audioPlayerProvider.tsx:404,413,417,575,585,594`, repositories.
- **제안**: 얇은 `shared/lib/logger`(레벨·환경 게이팅). `audioInstance.ts` 정보성 로그는 debug로 강등. `no-console` 린트(D2)와 연계.
- **리스크**: 낮음.

#### B7. 문자열 커스텀 이벤트 버스 — P1

- **문제**: `window.dispatchEvent`로 문자열 이벤트를 주고받아 타입 안전성·추적성 없음 → 리팩터링 취약.
- **근거**: `edmm:open-player-fullscreen`(`audioPlayer.tsx:79,85`, `trackDetailAside.tsx:178`), `edmm:player-track-zone-select`(`audioPlayer.tsx:108`, `musicShell/index.tsx:146,152`).
- **제안**: 이벤트명 상수화 + payload 타입 맵(`CustomEventMap`), 발신/수신 헬퍼로 캡슐화.
- **리스크**: 낮음.

#### B8. 시드 지문(fingerprint) 로직 이원화 — P1

- **문제**: dedupe 키를 서로 다른 방식으로 생성하는 두 함수가 공존 → 초기 진입 경쟁조건에서 재현 어려운 시드 버그 가능.
- **근거**: `buildTrackSeedFingerprint`(`musicShell/index.tsx:288`), `normalizeArtworkForFingerprint`(`useMusicShellTrackSeed.ts:34,64,127`).
- **제안**: 단일 유틸(`trackSeedUtils`)로 통합, 양측이 소비.
- **리스크**: 낮음~중(시드 로직 → 진입 스모크 확인).

#### B9. `dataType.ts` junk-drawer(183줄) — P1

- **문제**: 도메인·컴포넌트 props·context·http 타입이 한 파일에 혼재해 응집도 낮고 FSD 경계와 어긋남.
- **근거**: `dataType.ts` 전체(예: `PlayerTrackDetailsProps`, `InfiniteScrollContextType`, `HttpClientRequestConfig` 동거).
- **제안**: props는 각 컴포넌트로, http는 `shared/api`로 콜로케이트. 진짜 공유 도메인 타입만 잔류.
- **리스크**: 낮음(순수 이동, 컴파일러가 누락 검출).

#### B10. 배럴(public API) 규칙 불일치 — P1

- **문제**: 슬라이스 public API(`index.ts`)가 `views/*`·`widgets/*`에만 있고 `entities/*`·`features/*`·`shared/*`엔 없어 import 컨벤션 혼재.
- **근거**: 배럴 = `views/{home,search,library,trackDetail}`, `widgets/{audioPlayer,landing,musicShell,navSidebar,trackList}` 뿐.
- **제안**: 규칙 하나로 확정(배럴 도입 권장). `entities/track`, `features/audio`, `features/library`, `shared/db`부터.
- **리스크**: 낮음~중(대량 import 경로 변경 → 한 슬라이스씩).

### C. 성능 / 번들

#### C1. `next/dynamic` 사용처 0 — 연출 즉시 로딩 — P1

- **문제**: 지연 로딩이 전혀 없어 무거운 랜딩 연출(cobe 3D 지구본, deprecated 오브, 패럴랙스/스노우)이 초기 번들·초기 렌더에 즉시 포함. 개편 설계 §10 “연출 지연 로딩” 미반영.
- **근거**: `grep next/dynamic`=0. `landingHero.tsx:4-5` 정적 import.
- **제안**: 하단/무거운 연출을 `next/dynamic`(+`ssr:false`, `IntersectionObserver`)로 지연. A1과 함께 처리하면 효과 배가. 적용 전후 초기 JS 크기 측정.
- **리스크**: 낮음~중(레이아웃 시프트 주의 → 스켈레톤 유지).

#### C2. 플레이어 아트워크 raw `<img>` — next/image 부분 전환 — P2

- **문제**: 플레이어 아트워크가 `<img>`를 직접 사용해 Next 이미지 최적화(리사이즈/포맷) 미적용. eslint-disable로 명시적 우회. 단 호스트(`res.cloudinary.com` 등)는 이미 `next.config` `images.remotePatterns`에 등록되어 있어 "동적 CDN 호스트" 사유는 대부분 해소됨.
- **근거 (총 7개 `<img>`)**: 전경 아트워크 = `albumArtwork.tsx:53`(92×92), `m_albumArtwork.tsx:54`(54×54), `desktopFullscreenPlayer.tsx:152`(풀스크린 메인). 장식 배경 = `desktopFullscreenPlayer.tsx:62,69`(blur 72~92px, aria-hidden), `mobileFullscreenPlayer.tsx:151`(배경 워시), `fullscreenAlbumDisc.tsx:29`(`mix-blend-screen`+`animate-spin` 회전 디스크). `next.config.ts` remotePatterns에 cloudinary/wikimedia 등록됨.
- **판정: "전부"가 아니라 "부분 전환"이 정답.**
  - **전환 권장(전경 3~4개)**: 부모가 `relative`이므로 `<Image fill sizes=...>`로 교체. 실제 콘텐츠 이미지라 리사이즈/WebP 실이익이 큼.
  - **유지 권장(장식 배경 4개)**: (a) 전경과 **동일 `artworkSrc`**를 재사용해 현재는 1회 fetch로 공유되는데, next/image는 크기별로 **다른 최적화 URL**을 만들어 같은 원본을 중복 요청할 수 있음. (b) blur 72~92px 위에서는 최적화 화질 이득이 사실상 없음. (c) `fill` 래퍼 리팩터 비용만 증가. → 정당한 disable로 유지.
- **공통 주의**: (1) `artworkSrc`가 병합 로직에서 `image.streamUrl`로 폴백될 수 있어(`useCloudinaryTracks.ts:183`) 드물게 비이미지/비등록 host 가능 → `unoptimized` 폴백 또는 host 가드 필요. (2) 썸네일의 `onError` 재시도 + `key` 리마운트 패턴(`albumArtwork.tsx:54,62`)은 next/image에서 동작이 미묘하게 달라 폴백 회귀 검증 필요.
- **리스크**: 낮음. **선택 항목**(전경 한정 전환).

#### C3. 서버 Data Cache 미활용 — track 데이터 장기 캐싱 (ISR-equivalent) — P1

- **문제**: 트랙 데이터는 거의 불변인데, 서버 패칭이 Next Data Cache를 **명시적으로 끄고**(`cache: "no-store"`) 대신 손수 만든 짧은 TTL 인메모리 Map(video 60초 / image 300초 / all 120초)과 짧은 `Cache-Control`로만 캐싱한다. 그 결과 짧은 윈도우마다 Cloudinary Admin API를 반복 호출한다. "성능 우선 + 긴 주기"라는 요구와 어긋난다.
- **근거**: `shared/api/cloudinary/cloudinaryClient.ts:205`(`cache: "no-store"`), `:10-15`(TTL 60~300초 상수), `:31`(수제 `responseCache` Map), `:150-152`(`buildCloudinaryCacheHeader` — max-age가 TTL과 동일해 짧음), `app/api/cloudinary/tracks/route.ts:54`.
- **제안 (권장)**: 콘텐츠 불변성을 반영해 **서버 Data Cache로 장기 캐싱**한다. 이것이 사용자가 의도한 "ISR 기법"의 이 아키텍처용 등가물이다.
  1. `fetchCloudinaryTracks` 결과를 **Next 16 `'use cache'` + `cacheLife('days')`**(또는 `unstable_cache`)로 감싸 교차 요청·장기 캐싱. `revalidateTag('cloudinary-tracks')`로 드문 변경 시에만 수동 무효화.
  2. 위 도입 시 수제 `responseCache` Map은 **중복 → 제거**(단순화, B계열과 시너지).
  3. `Cache-Control`의 `s-maxage`/`stale-while-revalidate` 윈도우를 길게(예: 시간~일 단위) 확대.
- **주의 (페이지 레벨 ISR 부적합)**: `export const revalidate`(페이지 ISR)는 현재 구조에 맞지 않는다 — 데이터가 클라이언트 패칭(`useCloudinaryTracks`, `enabled: hydrated`)이고 `app/track/[id]/page.tsx:17`은 redirect라 정적 생성할 데이터-바인딩 HTML이 없다. 페이지 ISR을 원하면 데이터 패칭을 Server Component로 서버 이전하는 **별도 큰 작업**이며 본 문서 범위 밖(§6 후속).
- **리스크**: 낮음~중. 캐시 무효화 경로(트랙 추가/변경 시 `revalidateTag` 호출 지점)를 명확히 해야 함. 테스트의 `clearCloudinaryTrackCacheForTests`(`:136`) 의존부 갱신 필요.

### D. 테스트 / 안정성

#### D1. jest `coverageThreshold` 게이트 부재 — P1

- **문제**: `test:coverage`는 있으나 임계값 게이트가 없어 커버리지 하락이 막히지 않음.
- **근거**: `jest.config.js`에 `coverageThreshold` 없음. 테스트 47개.
- **제안**: 현재 수준을 baseline으로 완만한 `coverageThreshold`(global) 도입 후 점진 상향. 어댑터·repository·플레이어 우선.
- **리스크**: 낮음.

#### D2. ESLint 안전 규칙 다수 off — P1

- **문제**: 타입/안전 규칙이 꺼져 “깨끗함”이 강제가 아닌 규율에 의존(현재 위반 0건이나 미보장).
- **근거**: `eslint.config.mjs:44-51` — `@typescript-eslint/no-explicit-any: off`, `prefer-const: off`, `no-empty-object-type: off`, `preserve-caught-error: off`, `no-unused-vars: warn`.
- **제안**: 위반 0건 규칙부터 error 승격(`no-explicit-any`, `prefer-const`). `no-console`(warn) 추가로 B6 연계.
- **리스크**: 낮음(무위반 규칙부터).

---

## 4. 문서 검토 체크리스트 (문서검토 단계)

- [x] **전제 정확성**: Cloudinary 유지 / Audius 미도입이 문서 전반에 일관 반영(§1.2, §6). `TrackSource="cloudinary"` 정상 처리(§B1).
- [x] **근거 완비**: 모든 항목이 파일:라인 근거 보유. 초안 주장(“eslint-disable 0건”)은 실측 5건으로 **정정**(§2).
- [x] **개편 설계서 경계**: 오디오 노드 확장(A4)·소스 교체는 위임/제외로 중복 방지.
- [x] **모순 점검**: “Cloudinary=레거시 제거”류 잔여 표현 없음.
- [ ] **범위 적정**: 단일 사이클 소화 가능? P0(B1/B2/B4)만 먼저 끊는 안도 고려.
- [ ] **Task 독립성**: §5 각 Task가 build/test green 유지로 개별 병합 가능한지 최종 확인.

---

## 5. 작업 Task 분리 (구현 아님)

각 Task = 독립 브랜치/PR. **선행 관계**만 지키면 병렬 가능. 종료 게이트 = `npm run build` 성공 + `npm test` 통과.

| Task | 제목                                                                                           | 대응       | 우선순위 | 선행   | 규모 |
| ---- | ---------------------------------------------------------------------------------------------- | ---------- | -------- | ------ | ---- |
| T1   | 중복 타입 통합 (`AudioCapabilities` 단일화)                                                    | B2         | **P0**   | —      | S    |
| T2   | 트랙 모델 단일화 (`Track` 기준, `TrackInfo` 격하) + `playTrack` 반환 타입 정정                 | B1, B3     | **P0**   | T1     | L    |
| T3   | `audio.src` 이중 관리 일원화 (SSOT)                                                            | B4         | **P0**   | —      | M    |
| T4   | 죽은 코드/설정 정리 (deprecated 오브 · drizzle ignore · `labs/youtube-alt` · 미연결 자산 판단) | A1, A2, A3 | P1       | —      | S    |
| T5   | 로깅 seam 도입 + `console.*` 치환/게이팅                                                       | B6         | P1       | —      | M    |
| T6   | 문자열 이벤트 버스 → 타입 맵/상수화                                                            | B7         | P1       | —      | M    |
| T7   | 시드 지문 로직 단일 유틸 통합                                                                  | B8         | P1       | —      | M    |
| T8   | 랜딩 연출 지연 로딩 (`next/dynamic`)                                                           | C1         | P1       | T4     | M    |
| T9   | `dataType.ts` 분해·콜로케이트                                                                  | B9         | P1       | T2     | M    |
| T10  | 배럴(public API) 규칙 통일                                                                     | B10        | P1       | —      | M    |
| T11  | 거대 모듈 분해 (`audioPlayerProvider` → 훅 추출)                                               | B5         | P1       | T2, T3 | L    |
| T12  | ESLint 안전 규칙 재활성화(무위반부터)                                                          | D2         | P1       | T5     | S    |
| T13  | jest `coverageThreshold` baseline 게이트                                                       | D1         | P1       | —      | S    |
| T14  | (선택) 전경 아트워크만 `next/image` 부분 전환 (장식 배경 4개 유지 + host/onError 폴백 검증)    | C2         | P2       | —      | S    |
| T15  | track 데이터 서버 Data Cache 장기 캐싱 (`'use cache'`/`cacheLife` + `revalidateTag`, 수제 Map 제거) | C3     | P1       | —      | M    |

### 권장 진행 순서

1. **정리·기반(저위험, 빠른 green)**: T1 → T4 → T13. 병렬로 T10 착수 가능.
2. **P0 핵심**: T2, T3 (독립) → 그 위에서 T9, T11.
3. **품질 seam**: T5 → T12. 병렬로 T6, T7.
4. **성능**: T8(T4 이후), T15(독립·즉시 가능), 선택적으로 T14.

### 명시적 위임 / 제외

- **오디오 노드 체인 확장(gain/EQ/크로스페이드)** → 개편 설계서 Phase 4 (A4는 진단만).
- **콘텐츠 소스 교체(Audius 등)** → 미채택(§6).

---

## 6. 범위 밖 / 후속

- **외부 소스 교체(Audius/Deezer/…)**: 현재 미채택. 재검토 시 개편 설계서 §5 기반의 **별도 spec**을 세운다. 본 개선은 Cloudinary 단일 소스 전제에서 완결.
- **오디오 엔진 확장(크로스페이드·EQ)**: 별도 설계(Phase 4).
- **페이지 레벨 ISR(Server Component 데이터 이전)**: `/search`·홈의 데이터 패칭을 서버(Server Component)로 옮겨 `export const revalidate` 기반 정적 재생성을 적용하는 방안. 초기 로드/SEO 이점이 있으나 클라이언트 오디오 흐름과의 경계 재설계가 필요한 **대형 작업** → C3(서버 Data Cache)로 대부분의 성능 이득을 먼저 확보한 뒤 재검토. 별도 spec 대상.
- **신규 기능**: 플레이리스트 UI/가사 패널 등은 범위 밖.

---

## 7. 실행 위임 / 핸드오프

### 7.1 진행 절차
```
기획설계 → 코드베이스 기반 구체화 → 문서검토 → 작업 Task 분리 → 구현진행(X)
```
본 문서는 **작업 Task 분리(§5)** 까지 완료한다. **구현(구현진행 X)은 이번 세션에서 수행하지 않는다.**

### 7.2 구현 담당 이전 (→ Codex)
- §5의 Task를 **Codex에게 이전**해 구현한다. 각 Task는 파일:라인 근거·선행 관계·green 게이트가 명시되어 있어 그대로 착수 가능.
- 즉시 착수 가능(저위험·선행 없음): **T1·T3·T4·T13·T15**. L 규모(T2·T11)는 착수 전 TDD 스코프 확정 권장.
- 오디오 노드 체인 확장(A4 진단분)은 별도 설계서 [`docs/specs/2026-07-01-audio-engine-extension-design.md`](../specs/2026-07-01-audio-engine-extension-design.md)로 이관 — 그 문서의 크로스페이드는 본 문서 **T3·T11을 선행**으로 삼는다.

### 7.3 브랜치 전략
- **새 feature 브랜치를 생성해 진행한다.** 제안: `feature/codebase-improvements` (기준 브랜치: `dev`).
- 각 Task는 독립 커밋/PR 단위로, `npm run build` + `npm test` green을 유지한 채 진행 후 `dev`로 병합.

---

_본 문서는 진단과 Task 분리까지를 다루며, 구현은 Codex가 새 feature 브랜치에서 별도 진행한다._
