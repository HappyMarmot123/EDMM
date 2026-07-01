# EDMM 오디오 엔진 확장 설계서 (크로스페이드 · EQ · 비주얼라이저 · 백그라운드 컨트롤)

- 작성일: 2026-07-01
- 최신화: 2026-07-01 — **기능 D(Media Session / 백그라운드 컨트롤)** 편입, 관련 문서 상호링크, 백그라운드 suspend 리스크 반영(§D·§7·§10). **작업 Task 분리(§8-T, AE1~AE10) 추가.**
- ⚠️ **구현 현황(2026-07-01 재검증)**: AE1~AE8이 **이미 구현됨** — 아래 설계는 이력 보존. 상세는 **§ 구현 현황** 표 참조.
- 대상: EDMM — Web Audio 싱글톤(`src/shared/lib/audioInstance.ts`) 위에 **크로스페이드 · 이퀄라이저(EQ)** 를 신규 구현하고 **비주얼라이저를 확장**하며, 재생 계층에 **Media Session 백그라운드 컨트롤**을 추가한다.
- 전제: 콘텐츠 소스는 **Cloudinary**(Audius 미도입). 재생은 `Track.streamUrl`(Cloudinary video URL).
- 관계 문서:
  - [`docs/specs/2026-06-23-edmm-revamp-design.md`](2026-06-23-edmm-revamp-design.md) §8 (원 설계 방향)
  - [`docs/notes/2026-07-01-codebase-improvements.md`](../notes/2026-07-01-codebase-improvements.md) — 본 작업의 **선행 정리**(T3·T11)를 정의
  - [`docs/notes/2026-07-01-background-media-controls.md`](../notes/2026-07-01-background-media-controls.md) — 백그라운드 컨트롤 부재 **진단 메모**(기능 D의 근거)
  - [`docs/specs/2026-07-01-mobile-app-foundation-setup-design.md`](2026-07-01-mobile-app-foundation-setup-design.md) — 확실한 백그라운드 재생은 **네이티브(track-player)** 몫으로 위임
  - ⚠️ [`docs/plans/2026-06-23-phase4-player-audio-engine.md`](../plans/2026-06-23-phase4-player-audio-engine.md) — **STALE. 본 문서가 엔진 부분을 대체한다** (§0 참조)

> 성격: **설계(기획) 문서**. 실제 TDD 단계별 구현 계획은 승인 후 별도 plan 문서로 작성한다(본 문서 §8 참조).

> 진행 절차: **기획설계 → 코드베이스 기반 문서 구체화 → 문서 검토 → 작업 Task 분리 → 구현진행(X, 본 세션 제외)**. 구현은 **Codex에게 이전**하며, **새 feature 브랜치를 생성해** 진행한다(§11).

---

## ⚠️ 구현 현황 (2026-07-01 현행화) — 본 설계는 **대부분 구현 완료**

이 설계서 작성 이후 코드가 대폭 진전되어 **크로스페이드·EQ·Media Session·설정 저장이 이미 구현**되었다. 아래 원 설계(§0~§11)는 **이력·근거로 보존**하되, 현재 상태는 다음 표를 우선한다.

| 설계 Task | 상태 | 근거(현재 코드) |
|---|---|---|
| AE1 EQ 순수모듈 | ✅ 구현 | `shared/lib/equalizer.ts` |
| AE2 EQ 필터 체인(audioInstance) | ✅ 구현 | `audioInstance.ts:66` `equalizerFilters`, `:136` `createGain` |
| AE3 EQ 설정 저장/복원 | ✅ 구현 | `shared/db/repositories/audioSettingsRepo.ts`(+test) |
| AE4 EQ 패널 UI | ✅ 구현 | `features/audio/components/equalizerPanel.tsx`, `audioPlayer.tsx`·`trackDetailAside.tsx` 노출 |
| AE5 Media Session(기능 D.1) | ✅ 구현 | `shared/hooks/useMediaSession.ts` |
| AE6 크로스페이드 순수모듈 | ✅ 구현 | `shared/lib/crossfade.ts` |
| AE7 듀얼소스 + GainNode | ✅ 구현 | `audioInstance.ts:28` gain, 슬롯 기반 `:265` `slot.audio.src`, `:328-376` 크로스페이드 스케줄 |
| AE8 크로스페이드 통합 | ✅ 구현 | `audioInstance.ts:1` `applyCrossfadeSchedule/computeFade` import·사용 |
| AE9 비주얼라이저 저주파 펌핑(선택) | ❔ 미확인 | 실제 코드/커밋 재확인 필요 |
| AE10 백그라운드 재생 유지 D.2(선택) | ❔ 미확인 | Web Audio 제약, 재확인 필요 |

> **결론**: 본 문서는 **설계 이력**으로 두고, 잔여(AE9·AE10)만 별도 확인·진행. `audioInstance.ts`가 178줄 → **680줄**의 오디오 엔진으로 확장됨. 정확한 라인/구현 세부는 현재 코드/커밋 기준으로 판단할 것.

---

## 0. 기존 Phase 4 플랜과의 관계 — 반드시 먼저 읽을 것

`docs/plans/2026-06-23-phase4-player-audio-engine.md`는 존재하지만 **작성 당시(2026-06-23) 가정이 현재 코드와 크게 어긋난다.** 그대로 실행하면 안 된다.

| 옛 플랜 가정 | 현재 실제 코드 |
|---|---|
| `Track.source = "audius"`, 풀트랙 Audius 스트리밍 | **Cloudinary 단일 소스** (`entities/track/model.ts:1` `TrackSource="cloudinary"`) |
| 비주얼라이저를 `features/listModal/`에서 **이식** 필요 | listModal **제거됨**. 이미 `features/audio/components/audioVisualizer.tsx`로 이관·리팩터 완료 |
| 비주얼라이저 "펌핑효과 TODO 미완" 완성 필요 | 현재 코드에 **해당 TODO 없음**. `useCanvasAudioVisualizer`+`segmentedBarRenderer`+`albumColorPalette`로 재구성됨 |
| 반응형 크기 신규 구현 | **이미 구현됨** (`useCanvasAudioVisualizer.ts:67-76`, ResizeObserver) |
| `playerStore`/`queueStore`/`usePlayer`/`miniPlayer` 신규 생성 | 실제로는 **`audioPlayerProvider.tsx`(702줄)** 하나로 재생/큐/볼륨을 통합 구현 |
| 볼륨을 GainNode로 관리(전제) | 볼륨은 **`audio.volume`** 로 처리(`audioPlayerProvider.tsx:248,601`) — GainNode 부재 |

**결론:** 옛 플랜의 **플레이어/큐(Task4·5·7)** 는 이미 다른 형태(`audioPlayerProvider`)로 실현됐고, **엔진(Task1·2·3)·비주얼라이저(Task6)** 는 가정이 틀려 재설계가 필요하다. 본 문서가 그 재설계다. 옛 플랜은 archived로 표기 권장.

---

## 1. 현재 상태 (정확)

### 1.1 오디오 그래프 — 단일 체인
```
<audio>(단일) ─ MediaElementSource ─ AnalyserNode(fftSize 512) ─ destination
                                          │
                                          └─ getByteFrequencyData → 캔버스 비주얼라이저
```
- 근거: `audioInstance.ts:42`(단일 `new Audio()`), `:69-71`(source→analyser→destination). GainNode·BiquadFilter **없음**(grep 0건).
- 싱글톤은 `getAudioInstance/getAudioContext/getAnalyser`로 노출(`:146-162`), `audioInstanceStore`가 이를 래핑(`app/store/audioInstanceStore.ts:32-38`).

### 1.2 재생 제어 — `audioPlayerProvider.tsx`
- `audio.src`를 직접 세팅(`:366,393,553`)하고 `audio.volume`으로 볼륨/뮤트 제어(`:248,601`). **GainNode 미사용.**
- 이 파일은 개선 문서에서 **B4(audio.src SSOT 위반)·B5(702줄 비대)** 로 지목됨.

### 1.3 비주얼라이저 — 이미 리팩터됨
- `useCanvasAudioVisualizer.ts`: RAF 루프, ResizeObserver 반응형 크기, idle 렌더, `smoothingTimeConstant` 지원. `analyser` prop 하나로 구동.
- `analyser`는 전부 싱글톤 `getAnalyser()`에서 옴 → `audioAnalyser`로 각 뷰에 전달(`audioPlayer.tsx:120`, `trackDetail/index.tsx:216,282`, `trackDetailAside.tsx:236,266`).
- **함의(중요):** analyser는 그래프상 destination 직전에 있으므로, **EQ 필터를 source와 analyser 사이에 삽입하면 비주얼라이저가 자동으로 EQ 후단 신호를 반영**한다. 컴포넌트 수정 불필요.

---

## 2. 목표 그래프

```
audioA ─ sourceA ─ gainA ┐
                          ├─ [EQ: BiquadFilter × N (저/중/고역)] ─ Analyser ─ destination
audioB ─ sourceB ─ gainB ┘
```

- **크로스페이드**: 듀얼 엘리먼트(A/B) + 각 GainNode. 전환 시 gainA→0 / gainB→1 램프.
- **EQ**: `gains → BiquadFilter 체인 → analyser`. 프리셋 + Dexie 저장.
- **비주얼라이저**: 위 analyser 신호를 그대로 소비(현행 유지). EQ 삽입만으로 후단 반영.

---

## 3. 기능 A — 이퀄라이저(EQ) *(난이도: 중, 권장 1순위)*

**왜 1순위:** 단일 엘리먼트 구조를 바꾸지 않고 `source→analyser` 사이에 필터 체인만 삽입하면 되므로, 크로스페이드보다 **독립적이고 저위험**. 비주얼라이저 후단 반영도 공짜로 따라온다.

### 3.1 설계
- 순수 모듈 `equalizer.ts`: 밴드/프리셋 정의.
  - `interface EQBand { frequency: number; gain: number; type: BiquadFilterType }`
  - `type EQPresetName = "flat" | "edm" | "bass" | "vocal"`
  - 5밴드 예: 60(lowshelf)/250/1k/4k(peaking)/12k(highshelf).
- `audioInstance` 그래프 수정: `source.connect(filters[0]) → … → filters[n].connect(analyser)`. 현재 `source→analyser` 직결(`:70`)을 필터 체인 경유로 교체.
- 프리셋 적용 = 각 `BiquadFilterNode.gain.value` 설정. 설정값은 **Dexie에 저장**(신규 `settings` 스토어 또는 기존 repo 패턴 재사용) → 재방문 시 복원.
- UI: `equalizerPanel.tsx`(프리셋 버튼). 플레이어/트랙상세에 노출.

### 3.2 제약·주의
- `createMediaElementSource`는 엘리먼트당 1회 → 필터 삽입은 source 생성 이후 connect 재구성만. 기존 source 재생성 금지.
- 초기엔 `flat`(무변형)로 시작해 회귀 없음 보장.

---

## 4. 기능 B — 크로스페이드 *(난이도: 높음, 선행 정리 필요)*

**핵심 난점:** 현재는 **단일 `<audio>` 싱글톤**이고 볼륨을 `audio.volume`으로 제어한다. 크로스페이드는 **듀얼 엘리먼트 + GainNode**를 요구하므로, 싱글톤 구조와 `audioPlayerProvider`의 `audio.src`/`volume` 제어를 함께 손봐야 한다.

### 4.1 설계
- 순수 모듈 `crossfade.ts`: 램프 스텝 계산(`computeFade(direction, startTime, durationSec)` → `[{gain, atTime}]`). AudioContext 없이 단위 테스트 가능.
- `audioInstance`를 **듀얼 소스**로 확장: 엘리먼트 A/B 각각 독립 `MediaElementSource → GainNode`, 두 gain을 EQ 체인 입력에 병렬 연결.
- 전환: 비활성 엘리먼트에 다음 트랙 로드 → `gain.linearRampToValueAtTime`로 교차 → active 스왑.
- **볼륨 정책 결정 필요**(§7 미해결): 사용자 볼륨을 (a) 계속 `audio.volume`로 두고 crossfade는 별도 gain 배수로 처리, 또는 (b) 볼륨 자체를 masterGain으로 이전. (b)가 깔끔하나 provider 볼륨 로직(`:248,601`) 재작성 수반.

### 4.2 선행 의존성 (개선 문서)
- **T3(`audio.src` SSOT 일원화)**: 현재 `audio.src`가 3곳(`:366,393,553`)에서 설정됨. 듀얼 엘리먼트로 가기 전에 소스 설정 지점을 단일화해야 안전.
- **T11(`audioPlayerProvider` 분해)**: 702줄 provider에서 재생/큐/볼륨 책임을 훅으로 분리한 뒤 엔진 교체가 훨씬 안전. `usePlaybackSync` 추출 지점이 곧 크로스페이드 삽입 지점.
- → **크로스페이드는 T3·T11 이후 착수 권장.** EQ(§3)는 그 전에 독립 진행 가능.

### 4.3 제약·주의
- `createMediaElementSource` 엘리먼트당 1회 → A/B 각자 source/gain 고정.
- 자동재생 정책: `AudioContext.resume()`는 사용자 상호작용에서만(기존 정책 `audioInstance.ts:7-8` 유지).
- 크로스페이드 길이는 설정값(기본 예: 3초), 트랙이 짧거나 즉시 전환 시 0초 폴백.

---

## 5. 기능 C — 비주얼라이저 확장 *(난이도: 낮음, 대부분 완료)*

현재 비주얼라이저는 이미 반응형·모듈화 상태이므로 **신규 구현이 아니라 소폭 확장**이다.

### 5.1 이미 된 것 (재확인)
- 반응형 크기(ResizeObserver), RAF/cleanup, idle 렌더, 앨범 팔레트 연동 — `useCanvasAudioVisualizer.ts`, `segmentedBarRenderer.ts`, `albumColorPalette.ts`.

### 5.2 남은 확장
- **EQ 후단 반영**: §3의 EQ 삽입만으로 analyser가 후단 신호를 받으므로 **자동 달성**(코드 변경 0).
- **(선택) 저주파 가중 "펌핑" 강화**: `segmentedBarRenderer`의 막대 높이 계산에 저주파 가중치 옵션 추가. 현재 TODO는 없으므로 이는 **신규 개선(옵션)**, 필수 아님.
- **(선택) 듀얼 소스 전환 시 신호 연속성**: 크로스페이드 도중에도 analyser는 EQ 후단 단일 지점이라 연속 — 추가 작업 없음.

---

## 5-D. 기능 D — Media Session / 백그라운드 컨트롤 *(난이도: 낮음, 2026-07-01 최신화 추가)*

배경: 별도 진단([`background-media-controls`](../notes/2026-07-01-background-media-controls.md))에서 확인 — 현재 웹앱은 모바일 백그라운드/잠금화면에서 **이전/재생·정지/다음 컨트롤이 없다.** 원인 = ① `navigator.mediaSession` 미등록(`grep` 0건), ② 재생이 Web Audio(AudioContext) 경유라 백그라운드 suspend. 둘 다 **재생 계층(`audioPlayerProvider`)** 에서 다루므로 오디오 엔진 확장과 같은 지점(B4·B5·T11)에 자연스럽게 편입된다.

### D.1 설계 — Media Session 컨트롤 등록 (In scope)
- 현재 트랙 변경 시 `navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album, artwork })`.
- `setActionHandler('play' | 'pause' | 'previoustrack' | 'nexttrack', fn)` → **기존** provider의 `togglePlayPause`/`next`/`prev`에 연결(신규 재생 로직 아님, 얇은 연결).
- (선택) `setPositionState({ duration, position, playbackRate })` + `seekto` 핸들러 → 잠금화면 시크바.
- 가드: `"mediaSession" in navigator` 기능 탐지 + SSR 가드. 위치는 provider 또는 신규 `useMediaSession` 훅(T11 분해 지점과 동일).

### D.2 백그라운드 오디오 "재생 유지" (별개 난제 — 대부분 범위 밖)
- 컨트롤 **표시/연결**(D.1)과 백그라운드 **재생 지속**은 다른 문제다.
- Web Audio(AudioContext)는 백그라운드에서 suspend(iOS Safari 특히), 자동재생 정책상 자가 `resume()` 불가.
- 옵션: (a) `visibilitychange`에서 AudioContext suspend/resume 관리, (b) 재생 경로를 순수 media element로 두고 analyser는 포그라운드 한정 — 단 **크로스페이드/EQ(gain/filter)가 AudioContext를 요구**하므로 트레이드오프, (c) PWA(manifest+SW).
- **iOS Safari 백그라운드 재생은 근본적 제약** → 확실한 백그라운드 재생은 **네이티브(모바일앱, `react-native-track-player`)** 몫. [모바일 세팅 문서](2026-07-01-mobile-app-foundation-setup-design.md) 참조.

### D.3 범위 · 순서
- **In scope: D.1(Media Session 컨트롤 등록)** — 저비용·큰 효과, 선행 없음, EQ와 독립. Android Chrome은 PWA 없이도 컨트롤이 붙는다.
- **범위 밖/미해결: D.2 백그라운드 재생 유지**(비주얼라이저 analyser 요구와 충돌 가능) → §7 미해결로.

---

## 6. 파일 구조 (제안, 현재 경로 기준)

- Create: `src/shared/lib/equalizer.ts` — EQ 밴드/프리셋(순수)
- Create: `src/shared/lib/crossfade.ts` — 램프 계산(순수)
- Modify: `src/shared/lib/audioInstance.ts` — 필터 체인 삽입 → (2단계) 듀얼 소스+gain 확장
- Modify: `src/app/store/audioInstanceStore.ts` — 확장된 노드 노출
- Modify: `src/shared/providers/audioPlayerProvider.tsx` — 엔진 API로 재생/볼륨 위임 (T11 분해와 연계)
- Create: `src/shared/db/repositories/audioSettingsRepo.ts` (또는 기존 패턴) — EQ 프리셋 저장
- Create: `src/features/audio/components/equalizerPanel.tsx` — 프리셋 UI
- Create: `src/shared/hooks/useMediaSession.ts` (또는 provider 내 통합) — Media Session 메타데이터/핸들러(기능 D)
- (선택) Modify: `src/features/audio/components/visualizers/segmentedBarRenderer.ts` — 펌핑 옵션
- Test: `src/test/shared/lib/{equalizer,crossfade}.test.ts`, `useMediaSession` 테스트(navigator.mediaSession 모킹), 엔진 그래프 모킹 테스트

> 엔진 로직을 `audioInstance.ts`에 계속 둘지, 신규 `audioEngine.ts`로 분리할지는 §7 미해결. 테스트 용이성(노드 팩토리 주입) 위해 **분리 권장**.

---

## 7. 미해결 결정 (구현 계획 전 확정 필요)

1. **볼륨 이전**: 사용자 볼륨을 masterGain으로 이전할지, `audio.volume` 유지 + crossfade gain 분리할지. (§4.1)
2. **엔진 위치**: `audioInstance.ts` 확장 vs 신규 `audioEngine.ts`(팩토리 주입형, 테스트 유리). 
3. **EQ 밴드 수**: 3밴드(저/중/고) vs 5밴드. 프리셋 감도와 UI 복잡도 트레이드오프.
4. **크로스페이드 노출 범위**: 자동 트랙 전환에만? 사용자가 길이 설정 가능?
5. **EQ/크로스페이드 설정 저장소**: 신규 Dexie `settings` 스토어 vs 로컬스토리지.
6. **백그라운드 재생 유지 정책(기능 D.2)**: AudioContext suspend/resume 관리 vs 순수 element 경로 vs PWA. 비주얼라이저 analyser 요구와의 충돌 범위를 확정하거나, 웹에서는 컨트롤(D.1)만 하고 재생 유지는 네이티브로 위임할지 결정.

---

## 8. 단계 & 우선순위 (설계 레벨)

독립성·위험도 기준 권장 순서:

1. **Media Session 컨트롤 (기능 D.1)** — 선행 없음, 저위험·즉시 가능. 기존 재생 제어에 얇게 연결. EQ와 병행 가능.
2. **EQ (기능 A)** — 선행 없음, 저위험. `flat` 시작 → 회귀 0. 비주얼라이저 후단 반영 공짜.
   - 세부: `equalizer.ts`(순수) → `audioInstance` 필터 삽입 → `equalizerPanel` → Dexie 저장.
3. **개선 문서 T3·T11 정리** (선행 게이트) — `audio.src` SSOT + provider 분해.
4. **크로스페이드 (기능 B)** — T3·T11 이후. 듀얼 소스 확장 → `crossfade.ts` → 볼륨 정책 반영.
5. **비주얼라이저 옵션 (기능 C)** — 필요 시 저주파 펌핑 옵션.
6. **백그라운드 재생 유지 (기능 D.2)** — §7-6 정책 확정 후에만. 웹 제약이 크면 네이티브로 위임.

각 단계 종료 게이트: `npm run build` 성공 + `npm test` 통과 + 로컬 스모크(재생/EQ 전환/전환 페이드).

> 상세 TDD 단계별 계획은 본 설계 승인 후 `writing-plans`로 `docs/plans/2026-07-01-audio-engine-extension-plan.md`를 작성한다(옛 phase4 플랜 대체).

---

## 8-T. 작업 Task 분리 (구현 아님)

각 Task = 독립 브랜치/커밋 단위. **선행 관계**만 지키면 병렬 가능. 종료 게이트 = `npm run build` 성공 + `npm test` 통과 + 로컬 스모크. `AE*` 프리픽스로 다른 문서 Task(개선 `T*`, 모바일 `M*`)와 구분한다.

### 외부 선행 게이트 (개선 문서)
- **G-T3** — `audio.src` SSOT 일원화 ([codebase-improvements](../notes/2026-07-01-codebase-improvements.md) T3)
- **G-T11** — `audioPlayerProvider` 분해 (동 T11)
- → 크로스페이드 계열(AE7~AE9)의 **선행 게이트**. EQ·Media Session은 무관.

### Task 목록

| Task | 내용 | 대응 | 선행 | 규모 |
|---|---|---|---|---|
| **AE1** | EQ 밴드/프리셋 순수 모듈 `equalizer.ts`(+test) | A(§3.1) | — | S |
| **AE2** | `audioInstance` 그래프에 EQ BiquadFilter 체인 삽입(`source→filters→analyser`), 기본 `flat`로 회귀 0 | A(§3.1) | AE1 | M |
| **AE3** | EQ 설정 저장/복원 (`audioSettingsRepo`/Dexie) | A(§3.1) | AE2 | S |
| **AE4** | `equalizerPanel.tsx` 프리셋 UI + 플레이어/트랙상세 노출 | A(§3.1) | AE2 | S |
| **AE5** | Media Session 컨트롤 `useMediaSession`(metadata + play/pause/prev/next → 기존 provider 연결) | D.1(§5-D) | — | S |
| **AE6** | 크로스페이드 램프 순수 모듈 `crossfade.ts`(+test) | B(§4.1) | — | S |
| **AE7** | `audioInstance` 듀얼 소스(A/B) + GainNode 확장 (엔진 위치 §7-2 결정 반영) | B(§4.1) | AE2, G-T3, G-T11 | L |
| **AE8** | 크로스페이드 통합 (엔진↔provider 연결, 볼륨 정책 §7-1 반영, 0초 폴백) | B(§4) | AE6, AE7 | M |
| **AE9** | (선택) 비주얼라이저 저주파 펌핑 옵션 (`segmentedBarRenderer`) | C(§5.2) | AE2 | S |
| **AE10** | (선택·정책 확정 후) 백그라운드 재생 유지 D.2 (§7-6 결정 후) | D.2(§5-D) | §7-6 | M |

> 비주얼라이저 **EQ 후단 반영**은 AE2만으로 자동 달성(별도 Task 없음, §5.2).

### 권장 진행 순서
1. **즉시·저위험(선행 없음, 병렬)**: **AE5**(Media Session) + **AE1→AE2→AE3/AE4**(EQ 파이프라인).
2. **선행 게이트**: **G-T3·G-T11**(개선 문서) 병합.
3. **크로스페이드**: **AE6**(순수) → **AE7**(듀얼 소스) → **AE8**(통합).
4. **옵션**: **AE9**(펌핑), **AE10**(백그라운드 재생 — §7-6 확정 시에만).

### 미해결 결정과의 연결 (착수 전 확정)
- **AE7**: §7-2 엔진 위치(`audioInstance` 확장 vs 신규 `audioEngine.ts`), §7-1 볼륨 정책.
- **AE2/AE3**: §7-3 EQ 밴드 수, §7-5 설정 저장소.
- **AE8**: §7-4 크로스페이드 노출 범위.
- **AE10**: §7-6 백그라운드 재생 정책.

---

## 9. 범위 / 비범위

**In scope:** EQ(프리셋+저장), 크로스페이드(듀얼 소스), 비주얼라이저 EQ 후단 반영(+선택 펌핑), **Media Session 백그라운드 컨트롤 등록(기능 D.1)**.

**Non-goals:**
- 콘텐츠 소스 교체(Audius 등) — 미채택.
- 전체화면 플레이어 신규 설계 — 이미 존재(`desktopFullscreenPlayer`/`mobileFullscreenPlayer`), 본 작업은 엔진만.
- 리버브/컴프레서 등 EQ·크로스페이드 외 이펙트 — 후속.
- `audioPlayerProvider` 전면 재작성 — 개선 문서 T11 범위(본 작업은 그 결과 위에 얹음).
- **백그라운드 재생 "유지"(기능 D.2)·PWA화** — 웹 제약(특히 iOS Safari)이 커서 별도 검토/네이티브 위임. 본 문서는 컨트롤 등록(D.1)까지.

---

## 10. 리스크 요약

| 리스크 | 완화 |
|---|---|
| `createMediaElementSource` 재호출 오류 | 엘리먼트당 source 1회 고정, 그래프 재구성은 connect만 |
| 재생 회귀(크로스페이드) | T3·T11 선행 + 동작 동치 테스트 + 0초 폴백 |
| Jest에 AudioContext 부재 | 노드 팩토리 주입형 설계로 모킹(옛 플랜 Task3 패턴 계승) |
| 볼륨 이중 관리 혼선 | §7-1 볼륨 정책 먼저 확정 |
| 자동재생 정책 위반 | `resume()`는 사용자 제스처에서만 호출 유지 |
| Web Audio 백그라운드 suspend → 컨트롤(D.1)만으로 재생이 유지되지 않음 | 기대치 분리(컨트롤≠재생유지). 재생 유지는 §7-6 정책 or 네이티브 위임 |
| iOS Safari 백그라운드 재생 근본 제약 | 웹은 D.1까지, 확실한 백그라운드는 네이티브(track-player) |

---

## 11. 실행 위임 / 핸드오프

### 11.1 진행 절차
```
기획설계 → 코드베이스 기반 문서 구체화 → 문서 검토 → 작업 Task 분리 → 구현진행(X)
```
본 문서는 **작업 Task 분리**까지 완료한다. **구현(구현진행 X)은 이번 세션에서 수행하지 않는다.**

### 11.2 구현 담당 이전 (→ Codex)
- 실제 구현 작업은 **Codex에게 이전**한다. 본 설계서와 개선 문서(T3·T11 선행)를 입력으로 삼는다.
- Codex 착수 전 **§7 미해결 결정(볼륨 정책·엔진 위치·EQ 밴드 수·백그라운드 재생 정책 등)** 을 확정해 전달한다. 즉시 가능한 **기능 D.1(Media Session 컨트롤)** 은 EQ와 함께 우선 착수 후보.
- 승인 후 상세 TDD 계획(`docs/plans/2026-07-01-audio-engine-extension-plan.md`)을 작성해 옛 phase4 플랜을 대체한다.

### 11.3 브랜치 전략
- **새 feature 브랜치를 생성해 진행한다.** 제안: `feature/audio-engine-extension` (기준 브랜치: `dev`).
- 순서 반영: EQ(기능 A)를 먼저 올리고, 크로스페이드(기능 B)는 개선 문서 **T3·T11 병합 이후** 같은/후속 브랜치에서 진행.
- 각 단계는 `npm run build` + `npm test` green 유지, 단계별 커밋. 완료 후 `dev`로 PR.
