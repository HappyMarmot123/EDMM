# 모바일 뷰 — Recent 기능 / All·Recent 바텀 네비 제거

- 작성일: 2026-07-01
- 최신화: 2026-07-01 — 코드 근거 라인 **재확인(대체로 유지)**. 바텀 네비 `<nav>`는 현재 `:437` 부근(인용 범위 `:435-461` 내). 네이티브 앱 문서와의 구분 명시.
- 대상: EDMM **웹앱의 반응형 모바일 뷰**(모바일 앱 아님). `widgets/musicShell`.
- 목적: 모바일 뷰에서 **recent 기능을 사용하지 않으며**, 그에 따라 **하단 All/Recent 바텀 네비게이션을 제거**한다.
- 절차: 기획설계 → 코드베이스 구체화 → 문서검토 → Task 분리 → 구현진행(X). **구현은 Codex에게 이전**, **새 feature 브랜치**에서 진행(§5).
- 범위: 모바일 뷰(`md` 미만)만. **데스크톱(All/Recent)은 그대로 유지.**
- 관계 문서 (혼동 주의): 본 문서는 **웹앱의 반응형 모바일 뷰**다. **네이티브 모바일앱**(RN+Expo)은 별개 — [`docs/specs/2026-07-01-mobile-app-foundation-setup-design.md`](../specs/2026-07-01-mobile-app-foundation-setup-design.md). 두 작업은 무관하게 진행.

---

## 1. 현행 상태 (확인 완료)

현재 모바일 뷰에는 All/Recent 바텀 네비가 **존재하고**, recent가 **동작 중**이다 — 원하는 상태와 반대.

- **모바일 전용 바텀 네비 존재** — `widgets/musicShell/index.tsx`
  - `:38-41` `MOBILE_VIEW_OPTIONS = [{ value:"all", label:"All" }, { value:"recent", label:"Recent" }]`
  - `:435-461` 렌더: `<nav className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-2 ... md:hidden">` → 하단 고정·2칸·모바일 전용, `onClick={() => setView(value)}`.
- **데스크톱 헤더 토글은 모바일에서 숨김** — `musicShellHeader.tsx:73` All/Recent nav = `hidden ... md:flex`.
- **recent 데이터 동작** — `index.tsx:163` `useRecentPlays()`, `:169` `view === "recent"`일 때 `recentState.tracks` 렌더.
- **URL 초기 뷰** — `app/search/page.tsx:25`가 `?view=recent`를 파싱, `index.tsx:90` `normalizedInitialView`로 반영 → **딥링크로 모바일에서도 recent 진입 가능.**
- **레이아웃 의존** — `index.tsx:354` 컨테이너 하단 패딩이 바텀 네비 높이를 전제로 큰 값(`pb-[calc(148px+...)]`, `md:`에서 축소).

---

## 2. 변경 범위 & 영향

| 대상 | 변경 | 근거 |
|---|---|---|
| 모바일 바텀 네비 | **제거** | `index.tsx:435-461`, `MOBILE_VIEW_OPTIONS`(`:38-41`) |
| 모바일 `view` 값 | **"all" 고정** (모바일에서 recent 진입 차단, `?view=recent` 딥링크 포함) | `:90` `normalizedInitialView`, `:95` `view` state |
| 하단 패딩 | 바텀 네비 제거분만큼 **모바일 패딩 축소** | `:354` `pb-[calc(148px+...)]` |
| recent 데이터 훅 | (선택) 모바일에서 미사용 → 필요 시 게이팅 | `:163` `useRecentPlays`, `:166,169` |
| **데스크톱** | **변경 없음**(헤더 All/Recent 유지) | `musicShellHeader.tsx:73` `md:flex` |

### 유지 사항 (범위 밖)
- **recent 기록(`addRecentPlay`)은 전역 유지** — `audioPlayerProvider.tsx:7`. 데스크톱이 recent 뷰를 쓰므로 재생 시 기록은 계속한다. **모바일에서 제거하는 것은 "뷰/네비"뿐, 기록 로직이 아니다.**
- `views/library`의 recent 사용(`views/library/index.tsx:18`)은 별개 화면 — 본 변경 대상 아님.

---

## 3. 구현 시 주의

- 모바일 판정: 기존 `md` 브레이크포인트 규약과 일치시킬 것(바텀 네비가 `md:hidden`이었음). `view` 고정을 CSS 숨김만이 아니라 **상태 레벨에서** 처리해 `?view=recent` 딥링크에도 recent가 안 뜨게 한다.
- 바텀 네비 제거 후 스크롤 영역/`safe-area-inset-bottom` 패딩이 과도하게 남지 않도록 `:354` 값 재조정.
- 기존 테스트 확인·갱신: `src/test/widgets/musicShell.test.tsx`가 뷰 토글/바텀 네비를 검증하면 수정 필요.

---

## 4. 작업 Task 분리 (구현 아님)

종료 게이트: `npm run build` 성공 + `npm test` 통과 + 모바일/데스크톱 스모크.

| Task | 내용 | 규모 |
|---|---|---|
| M1 | 모바일 바텀 네비(`nav :435-461`) + `MOBILE_VIEW_OPTIONS` 제거 | S |
| M2 | 모바일에서 `view`를 "all"로 고정(딥링크 `?view=recent` 무시 포함) | S |
| M3 | 컨테이너 하단 패딩(`:354`) 모바일 값 재조정 | S |
| M4 | (선택) 모바일에서 `useRecentPlays` 계산 게이팅 | S |
| M5 | 관련 테스트(`musicShell.test.tsx`) 갱신 | S |

> 데스크톱 recent(헤더 토글·`views/library`)와 전역 recent 기록은 건드리지 않는다.

---

## 5. 실행 위임 / 핸드오프

- **구현은 Codex에게 이전.** 본 문서(§4 Task)를 입력으로 삼는다. 구현은 이번 세션에서 수행하지 않는다.
- **새 feature 브랜치를 생성해 진행한다.** 제안: `feature/mobile-remove-recent-nav` (기준 브랜치: `dev`).
- M1~M5를 한 PR로 묶어도 소규모. build/test green 유지 후 `dev`로 병합.

---

_본 문서는 확인·설계·Task 분리까지를 다루며, 구현은 Codex가 새 feature 브랜치에서 진행한다._
