# 플레이어 UX 고도화 — 아이디어 스크리닝 & 기획설계

- 작성일: 2026-07-02
- 상태: **기획설계 완료** (다음 단계: 코드베이스 기반 문서 구체화 → 문서 검토 → Task 분리 → 구현 → **사용자 수동 QA** → 이후 모바일 뷰 작업 검토)
- 범위: **태블릿·데스크톱 뷰 기준** 플레이어(하단 바 + 풀스크린, `min-width: 768px`). 모바일 뷰는 **무영향이 보장되어야 함** — 모바일 컴포넌트(`m_*`, `mobileFullscreenPlayer`)는 수정 대상이 아니며, 공유 코드 수정 시 모바일 파급을 차단해야 함 (§3.0)
- 원칙 1: 플레이어는 마우스 인터랙션이 가장 많은 구간 → **Spotify 수준의 마이크로 인터랙션 완성도**를 목표로 함
- 원칙 2: 본 플랫폼은 **상태 결합도가 높음** — 전역 상태(`audioPlayerProvider`)를 변경하지 않고 기존 API만 소비하며, 신규 상태는 컴포넌트 로컬로 격리해 사이드이펙트를 차단함 (§3.0)

---

## 1. 배경 및 문제 정의

사용자 관찰 + 코드 확인으로 검증된 문제 목록:

| # | 문제 | 코드상 원인 (확인됨) |
|---|------|---------------------|
| P1 | 풀스크린 on/off 시 전환 효과 없이 뚝 나타나고 뚝 사라짐 | `audioPlayer.tsx`에서 `isFullscreenOpen ? <DesktopFullscreenPlayer/> : null` 조건부 마운트. 페이드 상태 없음 |
| P2 | 풀스크린 prev/next 시 현재곡·다음곡 이미지가 동시에 겹쳐 크로스페이드 → 이미지 두 장이 블렌딩되며 멀미 유발 가능 | `useArtworkCrossfade`가 outgoing 레이어(opacity 1→유지) 위에 incoming(0→1)을 얹는 구조. outgoing이 fade-out 되며 두 이미지가 겹침 |
| P3 | 풀스크린/플레이어 버튼 클릭 후 단축키가 안 먹음 | 클릭한 버튼에 포커스가 남음 + `useAudioKeyboardShortcuts`의 `isShortcutBlockedTarget`이 `button, [role='button'], [role='slider']` 내부 타깃을 전부 차단 |
| P4-a | 프로그레스바 호버 시 시간 툴팁은 보이지만 은색 미리보기 바가 안 보임 | `global.css` `#seek-bar-container::before`가 `#3b3d50` + `opacity 0.2` — 어두운 배경(`bg-white/15`) 위에서 시인성 없음 |
| P4-b | 호버 시 현재 위치에 손잡이(thumb)가 없음 | thumb 요소 자체가 없음 (`seek-bar` div만 존재) |
| P4-c | 클릭으로만 seek 가능, 드래그 seek 불가 | `onClick`만 바인딩. pointer capture / drag 상태 없음 |
| P5 | 컨트롤 버튼 UX 저품질: cursor-pointer 없음, hover 컬러 이상 등 | `playerControlBtn.tsx`에 `cursor-pointer` 부재. play 버튼은 베이스 `hover:bg-white/10`과 `hover:bg-[#ffd6e1]`이 충돌(clsx만 사용, tailwind-merge 없음 → 선언 순서에 따라 흰 버튼이 반투명 어두운 색으로 변함) |
| P6 (발견) | seek 바 로직 중복 + dead code | `shared/components/trackSeekBar.tsx`는 `playerTrackDetails.tsx`와 거의 동일한 로직을 가진 **미사용 dead code**(import 하는 곳 없음 — grep 확인). 방치 시 고도화가 한쪽에만 적용돼 혼란 유발 |

---

## 2. 아이디어 제안 및 스크리닝

### 2.1 채택 (이번 라운드 구현 대상)

| ID | 아이디어 | 근거 |
|----|----------|------|
| A1 | 풀스크린 열기/닫기 fade 전환 (open: fade-in, close: fade-out 후 unmount) | P1 직접 해결. 저비용·고체감 |
| A2 | 아트워크 전환을 "out 즉시 제거 + in만 fade-in" 방식으로 변경. 단, **배경(backdrop)·팔레트는 기존 크로스페이드 유지** | P2 해결. 배경까지 즉시 스왑하면 화면 전체가 번쩍(flash)여 오히려 더 피로함 → 저주파(그라데이션) 배경은 블렌딩 유지, 고주파(이미지)만 스냅 아웃이 최적 |
| A3 | 단축키 차단 로직 재설계: "타이핑 컨텍스트"만 차단 + 마우스 클릭으로 활성화된 버튼은 포커스 해제(blur) | P3 해결. 키보드 접근성(포커스 링, Enter/Space 활성화)은 유지 |
| A4 | Spotify 스타일 seek 바: 호버 미리보기 바 시인성 수정, 호버/드래그 시 thumb 노출, 드래그 seek(pointer capture), 드래그 중 시각적 프리뷰 + 릴리즈 시 commit | P4 전체 해결. 플레이어 핵심 UX |
| A5 | 컨트롤 버튼 UX 정비: cursor-pointer, hover 컬러 충돌 해소, 일관된 상태 체계(기본/호버/활성/비활성), press 피드백, 누락 title 툴팁, shuffle 활성 인디케이터 | P5 해결 |
| A6 | seek 바 정리: 미사용 `trackSeekBar.tsx` 삭제 + `playerTrackDetails.tsx`의 seek 인터랙션을 전용 훅/컴포넌트로 추출해 A4 고도화의 단일 기반 마련 | P6 해결 — A4의 선행 작업. 모바일 seek(`mobileFullscreenPlayer` 자체 구현)는 건드리지 않음 |

### 2.2 보류 (다음 라운드 후보 — 이번 범위에서 제외)

| ID | 아이디어 | 보류 사유 |
|----|----------|-----------|
| D1 | 버퍼링(로드된 범위) 게이지 표시 | 오디오 엔진의 buffered ranges 연동 필요. seek 바 구조 개편(A4/A6) 안정화 후 얹는 게 안전 |
| D2 | 볼륨 슬라이더 동일 고도화(호버 시 thumb, 드래그 개선) | seek 바 패턴 확립 후 동일 패턴 이식이 효율적. cursor 등 기본 정비는 A5에 포함 |
| D3 | 남은 시간 토글(duration ↔ -remaining 클릭 전환) | 부가 기능. 핵심 UX 안정화가 우선 |
| D4 | 모바일 플레이어 동일 적용 | 이번 작업은 태블릿·데스크톱 뷰 한정(모바일 무영향 원칙). 터치 인터랙션 모델이 달라 별도 설계 필요. **본 라운드 구현 완료 + 사용자 수동 QA 통과 후 착수 검토가 확정된 후속 후보.** A4는 Pointer Events로 구현해 터치 호환 기반은 확보 |

### 2.3 기각

| 아이디어 | 기각 사유 |
|----------|-----------|
| 반복 재생(repeat) 버튼 | **구현하지 않기로 확정 (사용자 결정, 2026-07-02)** |
| Framer Motion 등 애니메이션 라이브러리 도입 | 필요한 전환이 전부 opacity/transform 단일 속성 → CSS transition으로 충분. 의존성·번들 비용 불필요 |
| 풀스크린 전환에 scale/zoom 연출 추가 | P2에서 모션 과다로 인한 멀미를 줄이는 방향과 상충. fade 단독이 목표에 부합 |
| 드래그 중 실시간 seek(매 이동마다 오디오 seek 호출) | 스트리밍 소스에 연속 seek 요청 부담 + 소리 튐. "시각 프리뷰 + 릴리즈 시 commit"이 업계 표준(Spotify 방식) |

---

## 3. 기획설계

### 3.0 공통 가드레일 — 모바일 무영향 · 사이드이펙트 차단 (모든 항목에 우선 적용)

**공유 코드 파급 지도 (grep으로 확인된 실제 의존)**

| 공유 코드 | 데스크톱 사용처 | 모바일 사용처 | 파급 위험 |
|-----------|----------------|---------------|-----------|
| `shared/components/playerControlBtn.tsx` | 하단 바 컨트롤 | `mobileFullscreenPlayer` (prev/next 등 3곳) | **높음** — A5/A3의 주 수정 대상 |
| `shared/components/iconToggleButton.tsx` | play/pause, mute | `mobileFullscreenPlayer`, `m_playerControlsSection` | **높음** |
| `shared/lib/util.ts` (`formatTime`, `handleMouseMove` 등) | seek 바 | `mobileFullscreenPlayer` (`formatTime`) | 중간 — 함수 시그니처 유지 필수 |
| `features/audio/hooks/useArtworkCrossfade.ts` | 데스크톱 풀스크린 전용 | 없음 | 낮음 |
| `shared/providers/audioPlayerProvider.tsx` | 전역 | 전역 | **수정 금지** |

**가드레일 규칙**

1. **공유 버튼 베이스의 동작 변경은 전부 opt-in**: 모바일에 파급되는 변경(press `active:scale`, 클릭 후 blur, `pointer-events` 정책 변경)은 베이스 기본값을 현행 유지하고, prop/variant로 데스크톱 사용처에서만 활성화한다. 터치에 무해한 `cursor-pointer` 같은 순수 데스크톱 속성만 베이스에 직접 추가 가능.
2. **전역 상태 불변**: `audioPlayerProvider`의 상태·액션(시그니처 포함)은 수정하지 않는다. 드래그 프리뷰, fade phase 등 신규 상태는 전부 해당 컴포넌트/훅의 로컬 상태로 격리한다. seek는 기존 `seek()` 액션을 드래그 릴리즈 시 1회 호출하는 것으로 한정.
3. **공유 유틸 시그니처 동결**: `util.ts`의 기존 함수는 시그니처·동작을 바꾸지 않는다. 새 동작이 필요하면 새 함수/훅을 추가한다.
4. **CSS 격리**: `global.css`의 `#seek-bar-container` 계열 셀렉터는 데스크톱 seek 바에서만 쓰이는지 확인 후 수정하고, 신규 스타일은 전역 id 셀렉터 대신 컴포넌트 스코프 클래스로 작성한다.
5. **뷰포트 경계**: 풀스크린 관련 변경은 기존 `FULLSCREEN_VIEWPORT_QUERY`(`min-width: 768px`) 게이트 안에서만 동작해야 하며, 이 경계 자체를 변경하지 않는다.
6. **회귀 안전망**: 각 Task 완료 시 모바일 관련 기존 테스트(`mobilePlayerControlsSection.test.tsx` 등) 통과를 필수 조건으로 하고, 수동 QA에 모바일 뷰포트 확인을 포함한다 (§5).

### 3.1 A1 — 풀스크린 open/close fade

**목표**: 풀스크린이 부드럽게 나타나고 사라진다. 닫는 중에도 조작이 씹히지 않는다.

**UX 동작 정의**
- 열기: 마운트 직후 opacity 0 → 1, **300ms ease-out**. 배경(어두운 base)과 콘텐츠가 함께 페이드.
- 닫기: opacity 1 → 0, **250ms ease-in** 완료 후 unmount. (닫힘은 열림보다 약간 빠르게 — 사용자가 "떠나려는" 순간엔 기다림을 최소화)
- 닫기 트리거(Esc, 축소 버튼)는 fade-out 중 중복 호출돼도 안전(idempotent).
- fade-out 중 하단 플레이어 바는 즉시 조작 가능해야 함 (풀스크린 레이어는 닫힘 시작 시 `pointer-events: none`).
- `prefers-reduced-motion: reduce` 시 fade 생략, 즉시 표시/제거 (기존 `useArtworkCrossfade`의 처리 방침과 동일).

**설계 방식 (대안 비교)**
- ~~CSS animation + `animationend`~~: unmount 타이밍 제어가 번거로움.
- **채택: open/closing/closed 3-상태 머신** — `isFullscreenOpen`을 boolean에서 phase 상태로 확장하거나 래퍼에서 exit-transition 상태를 관리. `transitionend` + 타임아웃 백업으로 unmount 확정(기존 `useArtworkCrossfade`의 "timeout backup" 패턴 재사용).

**성공 기준**: 열기/닫기 각각 1회의 부드러운 페이드, 닫힘 후 DOM에서 제거, reduced-motion에서 즉시 전환, 기존 풀스크린 테스트 전부 통과.

### 3.2 A2 — 트랙 전환 아트워크 "스냅 아웃 + 페이드 인"

**목표**: prev/next 시 이미지 두 장이 겹쳐 보이는 구간을 제거해 시각 피로(멀미) 요인을 없앤다.

**UX 동작 정의**
- **아트워크(중앙 이미지)**: 이전 곡 이미지는 전환 확정 시점에 **즉시 제거**(fade-out 없음). 새 곡 이미지만 opacity 0 → 1, **250~300ms ease-out** (현행 450ms보다 짧게 — 겹침이 없어졌으므로 빠른 페이드가 응답성에 유리).
- **배경(backdrop)·팔레트 색상**: 현행 크로스페이드(450ms) **유지**. 배경은 저주파 그라데이션이라 블렌딩이 자연스럽고, 즉시 스왑하면 화면 전체 색이 번쩍여 역효과.
- 새 이미지 로드가 끝나기 전 스냅 아웃하면 빈 화면이 생기므로, 현행 "팔레트 해석 완료 후 레이어 커밋" 게이트는 유지 — 즉, **이전 이미지는 새 이미지가 준비된 순간 제거**된다.
- 빠른 연속 스킵: 진행 중인 fade-in 레이어가 있어도 최신 트랙 기준으로 즉시 교체(레이어 2장 상한 유지).
- `prefers-reduced-motion`: 즉시 스왑(현행 동일).

**설계 방식**: `useArtworkCrossfade`에 전환 모드 개념 도입 — 아트워크 스테이지는 outgoing 레이어를 렌더하지 않고(또는 opacity 0 즉시), backdrop은 기존 2-레이어 크로스페이드 경로 유지. 훅이 레이어와 함께 "레이어별 전환 정책"을 내려주는 형태로 확장.

**성공 기준**: 전환 시 어느 프레임에도 두 아트워크가 동시에 보이지 않음. 배경은 부드럽게 블렌딩. 빈 화면(아트워크 공백) 프레임 없음.

### 3.3 A3 — 단축키 포커스 차단 재설계

**목표**: 플레이어를 마우스로 조작한 직후에도 Space/화살표/N/P 단축키가 항상 동작한다. 키보드 사용자의 접근성은 훼손하지 않는다.

**UX 동작 정의**
- 단축키를 **차단해야 하는 유일한 컨텍스트 = 타이핑/조작 충돌 지점**:
  - `input[type=text]` 등 텍스트 입력, `textarea`, `select`, `contenteditable` → 전면 차단 (현행 유지)
  - `input[type=range]`(볼륨 슬라이더), `[role='slider']`(seek 바) 포커스 시 → **화살표 키만** 차단 (해당 위젯의 고유 조작이므로), Space/N/P는 통과
- 일반 버튼(`button`, `[role='button']`)은 **차단 목록에서 제거**. 대신:
  - Space/Enter가 포커스된 버튼을 재활성화(중복 실행)하는 문제는 **"마우스 클릭으로 활성화된 버튼은 클릭 완료 후 blur"** 로 해결. 판별은 `click` 이벤트의 `detail > 0`(포인터 유래) 사용 → 키보드 Enter/Space 활성화(`detail === 0`)는 포커스 유지되어 접근성 보존.
  - blur 적용 대상: `PlayerControlButton`, `IconToggleButton` 등 플레이어 컨트롤 공용 버튼 (전역 버튼 전체에 강제하지 않음). **단, §3.0 규칙 1에 따라 blur는 opt-in prop으로 구현하고 데스크톱 사용처에서만 켠다** — 두 컴포넌트 모두 모바일 풀스크린에서 사용 중이므로 기본 동작을 바꾸면 안 됨.
- 풀스크린 내부: 단축키 버튼 등 클릭 후 다이얼로그로 재포커스하는 기존 `focusDialog` 패턴 유지·보강.

**성공 기준**: play 버튼 클릭 → 즉시 Space로 pause 가능. shuffle 클릭 → N/P 동작. Tab으로 버튼 포커스 후 Enter 활성화 시 포커스 링 유지. 검색 인풋 타이핑 중 Space가 재생을 토글하지 않음.

### 3.4 A4 + A6 — Spotify 스타일 seek 바 (공용 컴포넌트로 단일화)

**목표**: 마우스 인터랙션 밀도가 가장 높은 seek 바를 "호버만 해도 상태가 읽히고, 잡아서 끌 수 있는" 컨트롤로 만든다.

**선행 구조 작업 (A6)**: `playerTrackDetails.tsx`와 `trackSeekBar.tsx`의 중복 로직을 공용 `SeekBar` 컴포넌트(+ 인터랙션 훅)로 통합. 이하 고도화는 이 단일 컴포넌트에만 구현.

**레이어 구성 (아래→위)**
1. **트랙(미재생 영역)**: `bg-white/15` 유지
2. **호버 미리보기 바**: 커서 위치까지의 구간. `#3b3d50/0.2` → **밝은 반투명 화이트(`white/25` 수준)** 로 교체해 시인성 확보 (P4-a 수정)
3. **재생 완료 바**: 기본 흰색 → **호버/드래그 중 브랜드 핑크(#fd6d94)** (Spotify의 white→green 패턴 차용)
4. **thumb(손잡이)**: 12px 원형, 재생 위치 끝단. 기본 숨김(scale 0/opacity 0) → **바 호버 또는 드래그 중 표시**. 전환 ~120ms
5. **시간 툴팁**: 현행 유지하되 스타일 정돈. 드래그 중에는 커서가 아닌 **드래그 지점 시간** 표시

**드래그 seek 동작 정의 (Pointer Events 기반 — 마우스/터치/펜 공통)**
- `pointerdown`(바 또는 thumb) → `setPointerCapture` → 드래그 상태 진입. 즉시 해당 지점으로 **시각적** 진행률 이동.
- 드래그 중: 진행 바·thumb·툴팁이 포인터를 따라감. 포인터가 바 밖(상하/좌우)으로 나가도 캡처 유지, 값은 0~duration으로 클램프. **오디오 seek는 호출하지 않음.**
- 드래그 중 `timeupdate`로 인한 진행률 갱신은 무시(드래그 값이 우선).
- `pointerup` → 그 지점으로 **seek 1회 commit** → 드래그 상태 해제.
- `Esc` 키로 드래그 취소(원위치 복귀) — 선택 사양이지만 저비용이므로 포함.
- 클릭(이동 없는 down→up)은 자연히 "그 지점 commit"으로 동일 경로 처리 → 기존 클릭 seek와 호환.
- 진행률 width `transition-[width]`는 **드래그 중 비활성화** (따라오는 지연감 제거), 평상시 재생 틱에만 유지.
- 히트 영역: 시각적 바는 얇게 유지하되 상하 패딩으로 **실제 클릭 가능 영역 ≥ 16px** 확보.
- 키보드: 현행 좌우 화살표 ±5s 유지, `aria-valuenow`는 드래그 중 프리뷰 값 반영.

**성공 기준**: 호버 시 미리보기 바·thumb·툴팁이 즉시 인지됨. thumb를 잡고 끌어 원하는 지점 정확히 이동. 드래그 중 소리 튐/연속 seek 없음. 모달 플레이어(`trackSeekBar` 사용처)도 동일 UX. 기존 seek 관련 테스트 통과 + 드래그 시나리오 테스트 추가.

### 3.5 A5 — 컨트롤 버튼 상태 체계 정비

**목표**: 모든 플레이어 버튼이 "만질 수 있어 보이고", 상태가 색으로 정확히 읽힌다.

**공통 규칙 (`PlayerControlButton` / `IconToggleButton` 베이스에 적용 — §3.0 규칙 1 준수)**
- 두 컴포넌트는 모바일에서도 사용되므로, 베이스 직접 수정은 **모바일에 무해한 것만**: `cursor-pointer`, hover 클래스 충돌 해소. 그 외 동작 변경은 opt-in prop.
- `cursor-pointer` 추가, `disabled`엔 `cursor-not-allowed`(현행 `pointer-events-none` 제거 검토 — pointer-events가 없으면 커서·툴팁도 못 보여줌) + `opacity-40` 유지. disabled 스타일 변경이 모바일 렌더링에 미치는 영향은 구체화 단계에서 확인.
- 클래스 충돌 해소: 베이스의 `hover:bg-white/10`이 소비자 클래스와 충돌하지 않도록 **tailwind-merge 도입** 또는 베이스에서 hover bg를 variant로 분리 (play 버튼 hover 컬러 이상 현상의 근본 수정). hover는 터치 기기에서 발화하지 않으므로 모바일 무해.
- press 피드백: `active:scale-95` (transform 120ms) — **opt-in prop, 데스크톱 사용처에서만 활성화** (모바일 탭 동작 변경 방지)
- 모든 버튼에 `title` 툴팁 부여 (prev/next 등 누락분 보완) — 데스크톱 사용처의 props로 전달, 베이스 무관

**버튼별 상태 정의**

| 버튼 | 기본 | hover | 활성(토글 on) | 비고 |
|------|------|-------|---------------|------|
| shuffle | `white/60` | `white` + bg `white/10` | 핑크 `#fd6d94` + **하단 활성 점(dot)** | Spotify 패턴. on 상태 hover 시 밝은 핑크 |
| prev / next | `white/70` | `white` + bg `white/10` | — | |
| play/pause | 흰 원형, 검정 아이콘 | `scale-105` + 밝기 유지 (배경색 변경 대신 크기 피드백 — 충돌 이슈 원천 제거) | — | 가장 큰 시각 위계 유지 |
| fullscreen | `white/60` | `white` + bg `white/10` | 열림 상태에서 Minimize 아이콘 (현행) | |
| mute | `white/70` | `white` | 뮤트 시 아이콘 교체 (현행) | |

**성공 기준**: 전 버튼 hover 시 커서 포인터 + 일관된 색 변화. play 버튼 hover 시 색 오염 없음. shuffle on/off가 한눈에 구분됨. 기존 버튼 컴포넌트 테스트 통과.

---

## 4. 구현 순서 제안 (Task 분리 단계의 입력)

의존성 기준 순서 — 상세 분리는 "작업 Task 분리" 단계에서 확정:

1. **A6** seek 바 단일화 (구조 선행)
2. **A4** seek 바 고도화 (A6 위에 구현)
3. **A5** 버튼 상태 체계 (독립 — 병행 가능)
4. **A3** 단축키 차단 재설계 (A5의 버튼 베이스 수정과 접점 있음 → A5 후 진행)
5. **A1** 풀스크린 open/close fade (독립)
6. **A2** 아트워크 스냅 아웃 (A1과 같은 파일군 — 연달아 진행)

## 5. 검증 계획 (공통)

- 단위: 기존 Jest 테스트 스위트(`src/test/**`) 전체 통과 + 신규 동작(드래그 seek, blur-after-click, fade 상태 머신) 테스트 추가. **모바일 테스트(`mobilePlayerControlsSection.test.tsx` 등) 통과는 매 Task의 완료 조건**
- 수동(태블릿·데스크톱): ① 버튼 클릭 직후 단축키 ② thumb 드래그(바 밖 이탈 포함) ③ 풀스크린 열기/닫기/연타 ④ prev/next 연속 스킵 ⑤ `prefers-reduced-motion` 에뮬레이션 ⑥ 태블릿 폭(768px 근처) 경계 확인
- 수동(모바일 무영향 확인): 모바일 뷰포트에서 하단 플레이어·모바일 풀스크린의 버튼 탭, seek, 표시가 작업 전과 동일한지 확인 — 공유 버튼 컴포넌트 수정 Task(A5, A3) 후 필수
- 회귀 주의 지점: 풀스크린 override 트랙 동기화(`bc88474`에서 수정된 로직), 공유 버튼 컴포넌트의 모바일 사용처(`mobileFullscreenPlayer`, `m_playerControlsSection`), 전역 상태(`audioPlayerProvider`)는 소비만 하고 수정하지 않았는지 확인

## 6. 미해결 질문 — 전부 확정됨 (2026-07-02, 사용자 승인)

1. 아트워크 fade-in 시간: **`ARTWORK_FADE_MS` 상수(280ms 시작)로 관리**, 수동 QA에서 튜닝
2. `disabled:pointer-events-none`: **유지** — 제거 시 모바일 사용처까지 파급되므로 disabled 버튼 툴팁은 이번 범위에서 포기
3. 볼륨 슬라이더(D2): **보류 유지** — 단축키 복원과 직결되는 최소 범위(mute 버튼 blur/press, range 드래그 후 blur)만 이번 라운드에 편입

상세 결정 근거는 구현 계획(`docs/plans/2026-07-02-player-ux-enhancement.md`) 참조.
