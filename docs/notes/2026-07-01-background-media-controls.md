# 백그라운드 미디어 컨트롤 문서

- 작성일: 2026-07-01
- 기준일: 2026-07-01 (EDMM 코드베이스 현재 상태 기준)
- 대상: EDMM 웹앱 (모바일 브라우저/모바일 잠금화면/이어폰 컨트롤 포함)
- 절차: 기획설계 → 코드베이스 기반 문서구체화 → 문서검토 → 작업 Task 분리 → 구현진행
- 상태: 기획설계 완료 / 코드베이스 기반 문서구체화 완료 / 문서검토 완료 / Task 분리 완료 / T1 완료 / T2 완료 / T3 진행중 / T4 진행중 / T5 진행중
- 관계 문서:
  - [`docs/specs/2026-07-01-audio-engine-extension-design.md`](../specs/2026-07-01-audio-engine-extension-design.md)  
  - [`docs/notes/2026-07-01-codebase-improvements.md`](./2026-07-01-codebase-improvements.md)  
  - [`docs/specs/2026-07-01-mobile-app-foundation-setup-design.md`](../specs/2026-07-01-mobile-app-foundation-setup-design.md)

---

## 1) 기획설계

### 1.1 목표

모바일/데스크톱에서 백그라운드 미디어 컨트롤을 단계적으로 정리한다.

- `Media Session`(메타데이터·재생/일시정지/이전/다음 액션)는 **현재 구현 상태를 확인하고 운영 안정성을 확보**한다.
- 오디오가 백그라운드에서 유지되는지와 안 되는 경우의 범위를 **명시적으로 분리**해 오해를 방지한다.
- 웹 한계가 있는 `백그라운드 재생 유지(지속 재생)`는 옵션으로 분리하고, 네이티브 전환 조건을 문서화한다.

### 1.2 범위

- In Scope
  - `백그라운드 미디어 컨트롤`의 현재 상태 확정
  - `Media Session` 구현 상태 점검 및 회귀 테스트 설계
  - 백그라운드 지속 재생(재생 유지) 대응 방안의 정책 결정
- Out of Scope
  - 신규 음악 소스 전환(Audius/외부 API), 플레이어 UX 대규모 개편
  - 전체 오디오 엔진 고도화(EQ/크로스페이드)는 기존 오디오 엔진 확장 설계에서 처리

### 1.3 기대 결과

- `D.1` (Media Session): 컨트롤 표시·연동 정상화
- `D.2` (백그라운드 지속): 웹에서 가능한지/불가능한지 경계 문서 확정
- 브랜치 작업이 바로 시작 가능한 Task 목록(선행 관계/파일·검증 포함)

---

## 2) 코드베이스 기반 문서구체화

### 2.1 현재 상태 진단 (코드 근거 기반)

- **Media Session은 구현되어 있음**  
  - `src/shared/hooks/useMediaSession.ts:29-86`  
    `navigator.mediaSession` 존재 체크, `MediaMetadata` 등록, `play/pause/nexttrack/previoustrack/seekto` 핸들러 등록 및 정리 로직이 존재.
  - `src/shared/providers/audioPlayerProvider.tsx:446`  
    `useMediaSession(...)` 호출로 provider 상태(`isPlaying`, `currentTrack`, `togglePlayPause`, `nextTrack`, `prevTrack`, `seekTo`)를 전달.
- **백그라운드 지속 재생은 웹 제약으로 미확정 상태**  
  - `src/shared/lib/audioInstance.ts:11-16`  
    Web Audio 사용 설명과 `resume()` 정책(사용자 상호작용 필요)을 주석으로 명시.
  - `src/shared/lib/audioInstance.ts:98-99,135`  
    `new AudioContext()` 초기화 및 `createMediaElementSource` 경로 존재.
  - `src/shared/providers/audioPlayerProvider.tsx:275`, `401`  
    `audioContext.state === "suspended"` 시 `audioContext.resume()`을 시도.
  - `src/shared/hooks/useAudioPlaybackLifecycle.ts:24-33`  
    `document.visibilitychange`에서 백그라운드 진입 시 resume 시도를 수행.
- **PWA/manifest 기반 장기 백그라운드 특권은 미구성**  
  - `src/app/layout.tsx:7-45`  
    메타 설정만 존재하고 앱 매니페스트 링크/SW 등록 코드가 없음.
  - `next.config.ts`  
    `images.remotePatterns`만 설정되어 있으며 PWA/Service Worker 관련 설정 없음.
  - `package.json`  
    `next-pwa`/SW 관련 의존성 표기가 없음.
  - 프로젝트 루트에서 `manifest*.json` 검색 시 해당 파일 미검출.

### 2.2 해결 방향 재정렬

- 과거 진단(“세 원인 모두 미해결”)을 **현 상태에 맞게 정정**해야 한다.
  - `Media Session`은 이미 구현됨(AE5 완료로 표기 유지 필요).
  - 미해결은 사실상 `백그라운드 지속 재생` 범주 + PWA 미구성 + iOS 제약 대응 정책 수립이다.
- 기존 오디오 엔진 확장 설계와 연계:
  - `AE5`: D.1 Media Session은 이미 완료 상태.
  - `AE10`: D.2 백그라운드 지속 재생은 웹 제약이 커서 정책 결정 필요.

---

## 3) 문서검토

- [x] 목적/범위/근거가 현재 코드베이스와 정합되는가?
- [x] 과거 진단 문구(`미구현`)와 실제 구현 상태(`useMediaSession 존재`)를 분리했는가?
- [x] 백그라운드 이슈를 “컨트롤 노출”과 “재생 지속”로 분리했는가?
- [x] 연동 spec(`audio-engine-extension-design`)와 Task ID를 정합했는가?
- [x] AE10 진행 전 `iOS Safari`/`Android Chrome` 동작 차이의 수용 기준(정성/정량) 산정이 완료되었는가?
- [x] 구현 착수 전, manifest·SW 부재를 PWA 도입 범위 또는 네이티브 위임으로 문서 결재했는가?
- [x] 백그라운드 지속 실패 시 RN 전환 기준(정량 임계값, 플랫폼별 우선순위)을 문서화했는가?

---

## 4) 작업 Task 분리

### 4.1 Task 맵 (진행 순서 우선순위)

| ID | 제목 | 범위 | 선행 | 산출물 | 우선순위 |
|---|---|---|---|---|---|
| T1 | AE5 회귀 안정화 | `useMediaSession` 등록/해제 경로 검증, 호출부 타입 안정성 점검 | — | `src/shared/hooks/useMediaSession.test.ts`, `src/shared/providers/audioPlayerProvider.tsx` 회귀 테스트 연결 | ✅ 완료 |
| T2 | 백그라운드 정책 결정문서화 | D.2(백그라운드 지속) 수용 기준/한계 정의: Android/iOS 매트릭스 작성 | T1 | [`docs/specs/2026-07-01-background-media-controls-policy.md`](../specs/2026-07-01-background-media-controls-policy.md) | P0 |
| T3 | 백그라운드 유지 PoC(웹) | 옵션(a) visibility 기반 재생 제어 / 옵션(b) 순수 media element 우선 경로 / 옵션(c) PWA 포함)의 동작 비교 | T2 | `src/shared/hooks/useAudioPlaybackLifecycle.ts`, `src/shared/providers/useAudioElementSync.ts`, `src/shared/lib/audioInstance.ts`(PoC 분기) | P1 |
| T4 | PWA 기반 확장 조사 | 매니페스트/Service Worker 최소 구성 PoC, iOS·Android 동작 차이 검증용 메모 | T3 | `public/manifest.webmanifest`, `next.config.ts`, SW 등록/기록 | P2 |
| T5 | 네이티브 위임 판단 가이드 | AE10이 웹에서 비현실적일 경우 RN 이동 시점/브레이크포인트 정의 | T2 | [`docs/specs/2026-07-01-mobile-app-foundation-setup-design.md`](../specs/2026-07-01-mobile-app-foundation-setup-design.md)와 정합 | P1 |

### 4.2 Task 실행 가이드

- 기본 진행: `T1/T2 완료` → `T3/T4(병렬)`  
- `T5`는 `T2`에서 정책이 “웹 단독 처리 비현실”로 판정된 경우만 실행.
- 종료 게이트: `npm run build` + `npm test` + 모바일 재생 시나리오 스모크.

---

## 5) 구현진행

- 현시점 구현 진행 상태: **기획/구체화/검토/Task 분리 완료, T1 완료, T2 완료, T3 진행중, T4 진행중, T5 진행중**.
- 즉시 착수 권장: **T3/T4** (백그라운드 유지 PoC + PWA 실험 동시 진행).
- 주의점:
  - 백그라운드 제어와 백그라운드 지속은 동일 과제가 아니다.
  - 컨트롤(D.1)은 구현 완료되어도, 지속 재생(D.2)은 플랫폼/브라우저 정책으로 인해 별도 결정이 필요하다.
  - `T5`는 정책 판단 결과에 따라 네이티브 검토로 분기한다.

### 권장 브랜치 전략

- `feature/audio-background-controls-stability`에서 `T1/T2` 완료 후 `T3` 먼저 시작.
- `T2`에서 AE10 수행 범위를 lock 하고, 현재 경로는 `T3`/`T4` 동시 진행이며 `T5`는 정책 수용 후 검토.
- 각 Task는 독립 커밋/PR 유지.

---

_이 문서는 2026-07-01 기준 코드 근거로 "컨트롤 등록은 완료, 재생 지속은 정책 결정 필요"를 반영한다. 구현은 Task 순서(T2→T3/T4/T5)로 진행한다._

## 6) T2 산출물(초안)

- `docs/specs/2026-07-01-background-media-controls-policy.md`에 수용 기준/정책(안)을 정리 완료  
- 우선 목표: iOS/Android 기준 동작 범위를 정리하고, AE10 범위를 `web partial`과 `native only`로 분기

## 7) T3 진행 로그 (1차)

- PoC A(visibility/page visibility) 준비:
  - 백그라운드 전환에서 `pagehide`/`pageshow` 이벤트를 함께 수집해 복원 트리거 조건을 확장.
  - 포그라운드 복귀 시 `AudioContext.resume()` 후 `HTMLAudioElement.play()` 재시도 경로 추가.
- 코드 반영:
  - `src/shared/hooks/useAudioPlaybackLifecycle.ts`: 백그라운드 상태 추적 + pageshow/pagehide 복원 플로우 적용
  - `src/shared/providers/audioPlayerProvider.tsx`: `useAudioPlaybackLifecycle`에 `audio` 주입

## 8) T3 진행 로그 (2차)

- PoC B 준비 및 검증 기반:
  - `useAudioPlaybackLifecycle` 동작 검증 테스트 추가 (`pageshow`, `pagehide`, `visibilitychange`).
- 테스트 추가:
  - `src/test/shared/hooks/useAudioPlaybackLifecycle.test.ts`

## 9) T3 진행 로그 (3차)

- PoC 옵션 비교를 위한 실험 스위치 추가:
  - `restoreStrategy`를 `context-first` / `media-element-first`로 구분.
  - 기본값은 `context-first`, 테스트/검증용으로 `media-element-first` 동작을 강제 가능.
  - 연동: `process.env.NEXT_PUBLIC_AUDIO_BACKGROUND_RESTORE_STRATEGY=media-element-first` 시 `audio.play()` 우선 복원 경로로 전환.
- 코드 반영:
  - `src/shared/hooks/useAudioPlaybackLifecycle.ts`
  - `src/shared/providers/audioPlayerProvider.tsx`

## 10) T3 진행 로그 (4차)

- 실행 지침:
  - Android/iOS 비교 실험은 실행 시 `NEXT_PUBLIC_AUDIO_BACKGROUND_RESTORE_STRATEGY` 값을 각각 `context-first`, `media-element-first`로 교체해 비교.
  - 결과는 백그라운드 상태에서 3~5분간 재생 지속률, 복귀 시 `play()` 재호출 횟수, 사용자 제스처 필요성으로 수집.

## 11) T4 진행 로그 (1차)

- PWA 기반 확장 조사 착수:
  - 매니페스트 기본 정의(`manifest.webmanifest`) 추가.
  - SW 등록 스켈레톤(`sw.js`) 추가.
  - root 레이아웃에 매니페스트 링크 및 SW 등록 스크립트(기본) 연결.

## 12) T4 진행 로그 (2차)

- PWA 확장 보강:
  - 매니페스트에 설치 UX 안정화 필드(`start_url`, `display_override`, `lang`, `categories`, `shortcuts`) 보강.
  - iOS 홈화면 설치 대응 메타(`apple-mobile-web-app-capable`, `apple-touch-icon` 등) 추가.
  - SW 캐시 정책 보완:
    - 오디오/비디오 요청은 캐싱 제외.
    - `install` 시 기본 경로/매니페스트 프리캐시, `activate` 시 오래된 캐시 정리.

## 13) T4 진행 로그 (3차)

- T4 결과 정리 템플릿 생성:
  - `docs/specs/2026-07-01-background-media-controls-t4-checklist.md`

## 14) T5 산출물 초안

- 네이티브 위임 판단 가이드 문서 작성:
  - `docs/specs/2026-07-01-mobile-app-foundation-setup-design.md`

## 15) T5 진행 로그 (1차)

- AE10 진행 판단을 위한 임계값 문서를 초안화.
- iOS/Android 지표를 별도 평가하고, Web Partial + Native Gate 이원 정책으로 분리.
- 즉시 다음 액션으로, T3/T4 실험 데이터 반영 시 T5 게이트 계산식으로 결정 가능한 구조로 정리.
## 16) T5 진행 로그 (2차)

- 정책 연계 정리:
  - `docs/specs/2026-07-01-background-media-controls-policy.md` 하위에 T5 판단 문서 링크 추가
  - 현재 상태: **판정 대기 (실험 데이터 미수집)**
- 다음 실행 조건:
  - T3/T4 결과 2회 수집 후 각 Gate(안드로이드/iOS) 계산
  - A/B/C 중 최종안 확정 후 AE10 범위(웹-부분/네이티브 위임) 고정

## 17) T5 진행 로그 (3차)

- 판정 템플릿 추가:
  - 수집 일시: `2026-07-01`
  - 실행 조건 충족 여부: `false`
- Android Gate 계산 항목(미입력):
  - `10분 연속 재생 성공률`: `-`
  - `복귀 복구 지연(P95)`: `-`
  - `사용자 제스처 필요율`: `-`
- iOS Gate 계산 항목(미입력):
  - `백그라운드 제어 노출`: `미확인`
  - `iOS 연속재생 성공률`: `-`
  - `사용자 제스처 필요율`: `-`
- 최종안:
  - `미결정(데이터 대기)`

## 18) T5 진행 로그 (4차)

- 실행 템플릿 확정:
  - Android: `Run A` / `Run B` 2회 측정 후 평균·최소값으로 게이트 계산
  - iOS: `Run A` / `Run B` 2회 측정 후 동일 기준 적용
- 판정 우선순위(재확인):
  - iOS 제어 노출 실패 또는 (`iOS 연속재생 < 60%` AND 제스처율 `>= 40%`) 2회 적중 시 즉시 C안
  - Android Pass + iOS partial(단, 제어 노출은 정상) 시 A안
  - 그 외는 B안(추가 실험) 후 재평가

## 19) T5 진행 로그 (5차)

- T5 판정 데이터 입력 슬롯 확정:
  - 항목: `date`, `device`, `version`, `run_id`, `strategy`, `success_10m`, `restore_p95_sec`, `gesture_rate`, `control_visible`, `notes`
  - 입력 규칙: 각 플랫폼별 2회 이상 수집, 동일 전략 동일 조건으로 비교
- 즉시 투입 가능한 템플릿:
  - `Run A`: Android + context-first
  - `Run B`: Android + media-element-first
  - `Run C`: iOS + context-first
  - `Run D`: iOS + media-element-first
- 다음 액션:
  - T3/T4 원시 로그를 위 항목에 채운 뒤 `decision` 한 줄 계산 후 T5 최종안 기록
