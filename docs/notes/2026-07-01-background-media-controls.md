# 메모 — 백그라운드 미디어 컨트롤(이전/재생·정지/다음)이 안 되는 이유

- 작성일: 2026-07-01
- 최신화: 2026-07-01 — **방향 A(Media Session) 구현 완료** 확인 (`src/shared/hooks/useMediaSession.ts` 존재). 원인 ①은 해결됨. 방향 B/C는 잔존.
- 대상: EDMM 웹앱 (모바일 브라우저에서 잠금화면/알림 미디어 컨트롤)
- 성격: **진단 메모.** 구현 미포함.
- 계기: "모바일 YouTube는 백그라운드에서 prev/play-pause/next가 되는데 우리 웹앱은 안 됨 — 왜?"
- 관계 문서:
  - [`docs/specs/2026-07-01-audio-engine-extension-design.md`](../specs/2026-07-01-audio-engine-extension-design.md) — 방향 A/B가 **기능 D.1/D.2, Task AE5/AE10**으로 편입된 곳(구현 설계·Task)
  - [`docs/specs/2026-07-01-mobile-app-foundation-setup-design.md`](../specs/2026-07-01-mobile-app-foundation-setup-design.md) — 방향 C(네이티브 백그라운드 재생)

---

## 결론

백그라운드 컨트롤이 없는 이유 = **① Media Session API 미등록 + ② Web Audio(AudioContext) 경유라 백그라운드에서 오디오 suspend + ③ PWA/네이티브 아님.**

> **현행(2026-07-01):** ①은 **해결됨** — `src/shared/hooks/useMediaSession.ts`로 Media Session이 구현되어 잠금화면/이어폰 컨트롤이 붙는다. **②(백그라운드 재생 유지)·③(PWA/네이티브)** 는 여전히 미해결. 즉 컨트롤은 뜨지만 백그라운드 "재생 지속"은 별도 과제(방향 B/C).

---

## 1. Media Session API 미구현 (컨트롤이 안 뜨는 직접 원인)
- 잠금화면/알림/이어폰·블루투스 미디어 키는 `navigator.mediaSession`으로 OS에 등록해야 노출된다:
  - `mediaSession.metadata = new MediaMetadata({ title, artist, artwork })`
  - `mediaSession.setActionHandler('play'|'pause'|'previoustrack'|'nexttrack', fn)`
- **현재 코드에 전무** (`grep mediaSession` = 0건). OS가 표시/연결할 대상이 없어 컨트롤이 뜨지 않는다.

## 2. Web Audio(AudioContext) 경유 (소리 자체가 끊기는 원인)
- 재생이 순수 `<audio>`가 아니라 AudioContext 그래프로 흐른다: `createMediaElementSource → analyser → destination` (`shared/lib/audioInstance.ts:69-71`).
- 모바일 브라우저(특히 iOS Safari)는 백그라운드/화면잠금 시 **AudioContext를 suspend**, JS 타이머 throttle.
- 자동재생 정책상 `resume()`은 **사용자 제스처에서만** 동작(`audioInstance.ts:7-8,10`) → 백그라운드 자가 복구 불가.
- 결과: 컨트롤뿐 아니라 오디오도 멈추기 쉬움. (analyser(비주얼라이저) 때문에 AudioContext에 물려 있어 suspend 대상이 됨.)

## 3. PWA/네이티브 아님
- `manifest`·service worker 없음 → 설치형 앱 백그라운드 특권 없음.
- 모바일 YouTube 앱은 **네이티브**(백그라운드 오디오 서비스 + 알림 컨트롤). YouTube Music 웹/PWA는 MediaSession + SW + 설치형 PWA 조합. 우리는 일반 웹페이지.

---

## 개선 방향 (우선순위)

| 방향 | 효과 | 비고 |
|---|---|---|
| **A. `navigator.mediaSession` 도입** (메타데이터 + play/pause/prev/next 핸들러) | 잠금화면/알림/이어폰 키 컨트롤 노출 | ✅ **구현 완료** `src/shared/hooks/useMediaSession.ts` (기능 D.1 / AE5) |
| B. 백그라운드 오디오 유지 | 백그라운드에서 재생 지속 | 순수 media element 경로 + `visibilitychange` suspend/resume 처리 + PWA화. **iOS Safari는 여전히 제약**. → **엔진 설계서 D.2 / AE10, §7-6 미해결** |
| C. 네이티브(모바일앱) | YouTube 앱 수준의 확실한 백그라운드 재생 | `react-native-track-player`가 기본 제공 → [`2026-07-01-mobile-app-foundation-setup-design.md`](../specs/2026-07-01-mobile-app-foundation-setup-design.md)와 직결 |

### 착수 시 참고 (현행)
- **A는 오디오 엔진 설계서 [`§5-D 기능 D.1 / Task AE5`](../specs/2026-07-01-audio-engine-extension-design.md)로 편입됨** — 선행 없음·저위험, EQ와 병행 가능. 재생 로직이 `audioPlayerProvider`에 있어 그곳(또는 신규 `useMediaSession` 훅)에 핸들러 등록, 개선 문서 T11(provider 분해) 지점과 동일. → 착수는 그 문서 §8-T Task 표를 따른다.
- B는 AudioContext↔순수 element 트레이드오프가 있어 비주얼라이저(analyser) 요구와 충돌 검토 필요 → 엔진 설계서 **D.2 / §7-6 미해결 / AE10**.
- (참고) 재생 계층 정리 자체는 개선 문서 [`codebase-improvements`](2026-07-01-codebase-improvements.md) T3·T11.

---

_진단 메모. 구현/코드 변경 없음. 실제 반영은 오디오 엔진 설계서의 Task(AE5·AE10)로 진행한다._
