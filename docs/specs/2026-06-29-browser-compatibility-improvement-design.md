# EDMM 브라우저 호환성 개선 설계서

- 작성일: 2026-06-29
- 기준: Chrome에서 동작하는 현재 EDMM V2 UX
- 목적: Chrome 기준으로 구현된 기능을 Safari, Firefox, Edge 및 모바일 브라우저에서도 예측 가능하게 유지하기 위한 코드 개선 설계
- 산출물 범위: 구현 전 설계 문서. 실제 코드 변경은 별도 실행 계획에서 진행한다.

---

## 1. 아이디어 제안 및 스크리닝

### 1.1 후보 접근안

| 접근안                   | 설명                                                                 | 장점                                                         | 단점                                    | 판정                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- | -------------------- |
| 리스크 매트릭스 중심     | 사용 중인 브라우저 API와 CSS 기능을 표로 정리하고 위험도를 부여한다. | 빠르게 현황을 파악할 수 있다.                                | 코드 수정 단위가 모호해진다.            | 보조 자료로만 사용   |
| 기능 경계 중심           | 오디오, 비주얼라이저, 레이아웃, 저장소, 인터랙션 단위로 개선한다.    | 현재 코드 구조와 직접 맞물린다. 구현 계획으로 전환하기 쉽다. | 초기 문서 작성량이 조금 늘어난다.       | 채택                 |
| 브라우저별 시나리오 중심 | Safari, Firefox, Edge별 사용자 흐름을 중심으로 정리한다.             | QA 체크리스트로 좋다.                                        | 코드 중복 설명이 늘고 원인 분석이 늦다. | 검증 섹션에서만 사용 |

### 1.2 채택 방향

이번 개선은 기능 경계 중심으로 진행한다. 현재 코드가 이미 `AudioPlayerProvider`, `useCanvasAudioVisualizer`, `albumColorPalette`, `MusicShell`, Dexie 저장소처럼 기능별로 나뉘어 있으므로 문서도 같은 경계를 따른다.

검증 기준은 "Chrome에서 보이는 현재 UX를 기준선으로 유지하되, 브라우저별 기능 차이가 발생해도 핵심 흐름은 실패하지 않는 상태"로 둔다.

핵심 흐름:

1. `/search`에서 트랙 목록을 보고 선택할 수 있다.
2. 트랙을 재생, 일시정지, seek, volume 조작할 수 있다.
3. 데스크탑과 모바일 플레이어가 각 breakpoint에서 정상 표시된다.
4. 비주얼라이저나 앨범 색상 추출이 실패해도 재생 UI가 깨지지 않는다.
5. IndexedDB 저장소가 제한되어도 최근 재생/캐시 실패가 앱 전체 오류로 번지지 않는다.

---

## 2. 기획 설계

### 2.1 지원 범위

| 구분        | 기준                                                                               |
| ----------- | ---------------------------------------------------------------------------------- |
| 1차 지원    | 최신 안정 버전 Chrome, Edge, Firefox, Safari                                       |
| 모바일 확인 | iOS Safari, Android Chrome                                                         |
| 명시적 제외 | IE 11. `package.json`의 `browserslist`도 `not IE 11`이다.                          |
| 기본 전략   | polyfill 추가보다 feature detection, 안전한 fallback, Jest 테스트 보강을 우선한다. |

### 2.2 설계 원칙

- 브라우저 기능 미지원은 앱 크래시가 아니라 기능 축소로 처리한다.
- 오디오 재생이 가장 중요한 기능이다. 비주얼라이저, 앨범 색상, blur 효과는 실패해도 재생을 막지 않는다.
- SSR/CSR 차이가 있는 API는 effect 내부나 클라이언트 경계에서만 접근한다.
- CSS 최신 기능은 기존 Tailwind 클래스에 fallback 클래스를 추가하는 방식부터 검토한다.
- 새 dependency는 실제 결함을 해결하지 못하면 추가하지 않는다.

### 2.3 기능 경계

| 경계                | 주요 파일                                                                                                                                                                                                                                   | 호환성 관심사                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Audio Engine        | `src/shared/lib/audioInstance.ts`, `src/shared/providers/audioPlayerProvider.tsx`, `src/app/store/audioInstanceStore.ts`                                                                                                                    | `AudioContext`, `webkitAudioContext`, autoplay 정책, media element source, CORS 오디오 |
| Visualizer / Canvas | `src/features/audio/components/visualizers/useCanvasAudioVisualizer.ts`, `src/features/audio/components/visualizers/albumColorPalette.ts`, `src/features/landing/ui/landingCobeOrbit.tsx`                                                   | Canvas 2D, `getImageData`, CORS taint, `ResizeObserver`, animation loop                |
| Responsive Layout   | `src/widgets/musicShell/index.tsx`, `src/features/audio/ui/audioPlayer.tsx`, `src/features/audio/components/desktopFullscreenPlayer.tsx`, `src/features/audio/components/mobile/mobileFullscreenPlayer.tsx`, `src/shared/styles/global.css` | `matchMedia`, `100dvh`, safe-area inset, `backdrop-filter`, fixed overlays             |
| Browser Observers   | `src/shared/hooks/useInView.ts`, `src/shared/hooks/useInfiniteScroll.ts`                                                                                                                                                                    | `IntersectionObserver` 미지원/제한 환경                                                |
| Local Storage       | `src/shared/db/edmmDB.ts`, `src/shared/db/repositories/*`, `src/features/library/hooks/*`                                                                                                                                                   | IndexedDB/Dexie, private browsing, quota/storage denial                                |
| Interaction         | `src/features/audio/hooks/useAudioKeyboardShortcuts.ts`, `src/features/audio/components/mobile/mobileFullscreenPlayer.tsx`                                                                                                                  | keyboard event, pointer event, drag dismissal                                          |

### 2.4 코드베이스 관찰 요약

현재 코드와 테스트를 기준으로 문서 내용을 다음처럼 보정한다.

- `package.json` 기준 런타임은 Next.js 16.2.9, React 19.2.7, Tailwind CSS 4.3.1, Jest 30이다. `browserslist`는 `defaults`, `not IE 11`이므로 IE 11 대응은 범위 밖이다.
- 이미 구현된 방어 로직:
  - `audioInstance.ts`는 `AudioContext || webkitAudioContext`를 사용한다.
  - `albumColorPalette.ts`는 SSR, 이미지 로드 실패, canvas context 없음, `getImageData` 예외에서 fallback palette를 반환한다.
  - `landingCobeOrbit.tsx`는 `createGlobe` 실패를 catch하고, `ResizeObserver`가 없을 때도 `window.resize` listener를 사용한다.
  - `useAudioKeyboardShortcuts.ts`는 입력 요소, `contentEditable`, `[role='button']`, `[role='slider']` 안에서는 전역 shortcut을 막는다.
  - `mobileFullscreenPlayer.tsx`는 `onPointerCancel`에서 drag 종료 처리를 호출한다.
- 남은 핵심 gap:
  - `useInView.ts`, `useInfiniteScroll.ts`는 `IntersectionObserver` 존재 여부를 확인하지 않는다.
  - `useCanvasAudioVisualizer.ts`는 `ResizeObserver`가 없을 때 initial size만 맞추고 resize fallback은 없다.
  - `MusicShell`과 `AudioPlayer`에 `matchMedia` 구독 로직이 중복되어 있다.
  - Dexie repository는 실패를 도메인 기본값으로 변환하지 않는다.
  - 테스트는 정상 흐름 중심이며, 브라우저 API 미지원 mock 케이스가 부족하다.

---

## 3. 코드베이스 기반 문서 구체화

### 3.1 Audio Engine

현재 상태:

- `audioInstance.ts`는 브라우저에서 `new Audio()`를 만들고 `AudioContext || webkitAudioContext`를 사용한다.
- `audioPlayerProvider.tsx`는 재생 시 `audioContext.resume()`과 `audio.play()` 실패를 catch한다.
- `audioInstanceStore.ts`는 클라이언트에서 store 생성 시 오디오 인스턴스와 오디오 컨텍스트를 가져온다.

리스크:

- Safari/iOS는 사용자 제스처 전 오디오 컨텍스트와 autoplay 정책이 더 엄격할 수 있다.
- `createMediaElementSource`와 cross-origin audio는 CORS 헤더가 맞지 않으면 analyser 데이터가 기대와 다르게 동작할 수 있다.
- 오디오 컨텍스트가 없거나 suspended 상태가 오래 유지되어도 UI가 재생 가능 상태처럼 보일 수 있다.

개선 설계:

1. `audioInstance.ts`의 생성 결과를 capability 상태로 분리한다.
   - `audioElementAvailable`
   - `audioContextAvailable`
   - `analyserAvailable`
   - `initializationError`
2. `AudioPlayerProvider`는 재생 실패를 단순 console warning으로 끝내지 않고 내부 상태에 보관한다.
   - 예: `playbackError: "autoplay-blocked" | "unsupported-audio-context" | "source-load-failed" | null`
3. analyser가 없으면 비주얼라이저만 idle fallback으로 유지하고 재생 컨트롤은 계속 사용 가능해야 한다.
4. 오디오 컨텍스트 생성 시점은 현 구조를 유지하되, Safari 계열에서 문제가 확인되면 첫 사용자 재생 액션으로 lazy initialization을 옮기는 2단계 개선안을 둔다.

검증:

- `audioContext`가 `null`인 mock 환경에서도 player provider가 렌더링된다.
- `audio.play()`가 reject되어도 `isPlaying`이 false로 복구된다.
- analyser가 없으면 visualizer canvas가 idle 상태로 표시된다.

### 3.2 Visualizer / Canvas

현재 상태:

- `useCanvasAudioVisualizer.ts`는 Canvas 2D context를 얻고 `ResizeObserver`가 있으면 canvas 크기를 동기화한다.
- `albumColorPalette.ts`는 이미지에 `crossOrigin = "anonymous"`를 설정하고, `getImageData` 실패 시 fallback palette를 반환한다.
- `landingCobeOrbit.tsx`는 `createGlobe` 실패를 catch하고, `ResizeObserver`가 없으면 window resize listener만 사용한다.

리스크:

- `ResizeObserver`가 없는 환경에서 audio visualizer canvas 크기가 stale해질 수 있다.
- album artwork 서버의 CORS 설정에 따라 `getImageData`가 예외를 던질 수 있다.
- canvas context 생성 실패 또는 WebGL/canvas 렌더 실패 시 decorative UI가 빈 영역으로 남을 수 있다.

개선 설계:

1. `useCanvasAudioVisualizer.ts`에 `ResizeObserver`가 없을 때 window `resize` fallback을 추가한다.
2. `albumColorPalette.ts`의 fallback 동작은 유지하고, CORS 실패 테스트를 명시적으로 보강한다.
3. `landingCobeOrbit.tsx`는 `createGlobe` 실패 시 현재 CSS 배경/정적 장식 fallback이 실제로 보이는지 테스트로 고정한다.
4. animation loop는 `prefers-reduced-motion`과 inactive 상태를 더 엄격히 반영한다.

검증:

- `ResizeObserver`를 undefined로 둔 테스트에서 visualizer hook이 throw하지 않는다.
- `getImageData`가 throw하면 `FALLBACK_ALBUM_PALETTE`를 반환한다.
- reduced motion 환경에서 landing globe animation frame 요청이 발생하지 않는다.

### 3.3 Responsive Layout / CSS

현재 상태:

- `MusicShell`은 `h-[100dvh]`, `max-h-[100dvh]`, safe-area padding, fixed bottom navigation을 사용한다.
- fullscreen player는 `min-h-dvh`와 fixed overlay를 사용한다.
- 하단 player와 bottom tab은 `backdrop-blur-xl`에 의존한다.
- desktop/mobile 분기는 `matchMedia`와 Tailwind `md` breakpoint를 같이 사용한다.

리스크:

- dynamic viewport unit은 모바일 브라우저 UI가 접히고 펼쳐질 때 크기가 바뀌어 스크롤 중 UI 재계산이 발생할 수 있다.
- `backdrop-filter`는 최신 브라우저에서는 지원되지만 오래된 브라우저에서는 blur 없이 반투명 배경만 남는다.
- viewport 분기 로직이 여러 파일에 중복되어 브라우저 API fallback이 흩어진다.

개선 설계:

1. `100dvh` 사용 위치에는 fallback 클래스를 함께 둔다.
   - 예: `h-screen h-[100dvh]`, `max-h-screen max-h-[100dvh]`, `min-h-screen min-h-dvh`
2. blur가 없어도 읽을 수 있도록 overlay 배경 투명도는 유지하거나 더 불투명한 fallback class를 둔다.
3. `matchMedia` 중복 로직은 작은 hook으로 통합한다.
   - 후보: `src/shared/hooks/useMediaQuery.ts`
   - legacy `addListener/removeListener` fallback은 현재처럼 유지한다.
4. mobile fullscreen drag-dismiss는 pointer event 미지원 fallback까지 넓히기보다, 현재 target 브라우저에서 pointer event 검증을 우선한다.

검증:

- `window.matchMedia`가 없는 테스트 환경에서도 player와 shell이 기본 레이아웃으로 렌더링된다.
- 767px/768px 경계에서 모바일 row select와 데스크탑 detail select가 분리된다.
- blur 미지원은 시각 효과만 줄고 버튼/텍스트 가독성을 해치지 않는다.

### 3.4 Browser Observers

현재 상태:

- `useInView.ts`와 `useInfiniteScroll.ts`는 `IntersectionObserver` 존재 여부를 확인하지 않고 바로 생성한다.

리스크:

- 오래된 WebView, 제한된 테스트 환경, 일부 embedded browser에서 `ReferenceError`가 날 수 있다.
- lazy reveal 또는 infinite scroll 기능 실패가 페이지 렌더 실패로 전파될 수 있다.

개선 설계:

1. `useInView`는 `IntersectionObserver`가 없으면 즉시 `inView = true`로 처리한다.
   - 목적: lazy reveal이 미지원 환경에서 콘텐츠를 숨기지 않도록 한다.
2. `useInfiniteScroll`은 observer가 없으면 target ref만 반환하고 자동 load-more를 비활성화한다.
   - 필요하면 수동 "더 보기" 버튼을 사용하는 컴포넌트에서 별도 처리한다.
3. observer 생성부는 try/catch로 감싸 root/threshold 옵션 오류가 앱 전체 오류로 번지지 않게 한다.

검증:

- `global.IntersectionObserver = undefined` 상태의 Jest 테스트를 추가한다.
- observer callback이 중복 호출되어도 cleanup이 안정적으로 실행된다.

### 3.5 Local Storage / IndexedDB

현재 상태:

- Dexie DB는 `src/shared/db/edmmDB.ts`에서 `edmm` 데이터베이스와 5개 table을 정의한다.
- repository는 `db.trackCache.put`, `db.trackCache.get`, `bulkGet` 등을 직접 호출한다.
- 일부 호출부는 `.catch()`로 실패를 흡수하지만 repository 레벨의 공통 fallback은 없다.

리스크:

- private browsing, quota exceeded, storage permission 제한에서 Dexie 작업이 reject될 수 있다.
- 최근 재생/캐시 실패가 detail 복원 실패로 이어질 수 있다.

개선 설계:

1. 저장소 repository에서 실패를 도메인 기본값으로 변환하는 safe wrapper를 둔다.
   - `getCachedTrack` 실패: `undefined`
   - `getCachedTracks` 실패: `[]`
   - `cacheTrack` 실패: 조용히 실패하되 개발 환경 warning
2. `useRecentPlays` 등 live query hook은 Dexie 오류 시 빈 목록과 error 상태를 분리한다.
3. 데이터 캐시 실패는 오디오 재생 실패로 이어지지 않도록 player queue는 메모리 상태를 우선한다.

검증:

- fake-indexeddb 기반 기존 테스트에 reject case를 추가한다.
- 캐시 실패 후에도 `/search` list와 player control이 렌더링된다.

### 3.6 Interaction

현재 상태:

- keyboard shortcuts는 입력/버튼/링크/slider/contentEditable 상호작용 중에는 무시한다.
- mobile fullscreen player는 drag-to-dismiss, `onPointerCancel`, timeout 기반 close transition을 사용한다.

리스크:

- 브라우저별 keyboard event target 차이로 spacebar가 page scroll과 충돌할 수 있다.
- touch/pointer 이벤트 구현 차이로 drag close가 의도치 않게 click close와 겹칠 수 있다.

개선 설계:

1. keyboard shortcut 테스트에 이미 차단 중인 `contentEditable`, `role="slider"`, range input 케이스를 회귀 테스트로 추가한다.
2. mobile fullscreen drag threshold와 click guard는 현재 구조를 유지하되, pointer cancel cleanup과 pointer capture 예외 방어 여부를 테스트한다.
3. 재생 버튼은 shortcut보다 명시적 click/tap을 항상 우선한다.

---

## 4. 구현 우선순위

### P0: 크래시 방지와 핵심 재생 보존

1. `useInView`, `useInfiniteScroll`의 `IntersectionObserver` feature detection.
2. `useCanvasAudioVisualizer`의 `ResizeObserver` 미지원 fallback.
3. Dexie repository safe wrapper.
4. `audio.play()` reject, `AudioContext` 미지원, analyser 미지원 상태 테스트 보강.

### P1: 레이아웃과 시각 fallback 안정화

1. `100dvh`/`min-h-dvh` fallback class 추가.
2. `backdrop-filter` 미지원 시에도 읽히는 overlay 색상 점검.
3. `useMediaQuery` 공통 hook 도입.
4. landing cobe 실패 시 정적 fallback 표시.

### P2: 브라우저 QA 자동화/운영 보강

1. 브라우저별 수동 체크리스트를 `docs/plans`에 별도 작성.
2. Playwright 또는 외부 브라우저 테스트 서비스 도입은 P0/P1 완료 후 별도 자동화 계획에서 판단한다.
3. Safari/iOS 실기기에서 autoplay, safe-area, mobile fullscreen drag 동작을 확인한다.

---

## 5. 테스트 및 검증 전략

### 5.1 Jest 단위 테스트

추가/보강 대상:

- `src/test/shared/hooks/useInView.test.tsx`
- `src/test/shared/hooks/useInfiniteScroll.test.tsx`
- `src/test/features/audio/audioVisualizer.test.tsx`
- `src/test/features/audio/albumColorPalette.test.ts`
- `src/test/shared/db/repositories/*.test.ts`
- `src/test/features/audio/audioKeyboardShortcuts.test.tsx`

필수 mock 케이스:

- `window.matchMedia` 없음
- `ResizeObserver` 없음
- `IntersectionObserver` 없음
- `HTMLCanvasElement.getContext` null 반환
- `CanvasRenderingContext2D.getImageData` 예외
- `audio.play()` Promise reject
- Dexie repository reject

### 5.2 수동 브라우저 체크리스트

| 브라우저       | 체크 항목                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Chrome         | 기준 UX 유지, visual/interaction regression 확인                                                |
| Edge           | Chrome과 동일 흐름, media/autoplay 차이 확인                                                    |
| Firefox        | range input, scrollbar, canvas visualizer, keyboard shortcut 확인                               |
| Safari         | AudioContext resume, iOS safe-area, `100dvh`, backdrop blur fallback, canvas CORS fallback 확인 |
| Android Chrome | mobile mini player, fullscreen open/close, bottom tab safe-area 확인                            |

### 5.3 UX 영향 QA

기능 단위 테스트는 크래시와 상태 전이를 검증하지만, 이번 변경은 player, fullscreen overlay, mobile bottom navigation, visualizer, safe-area, blur fallback처럼 화면 체감이 큰 영역을 건드린다. 따라서 P0/P1 구현 후에는 “동작한다”뿐 아니라 “현재 EDMM V2 UX를 해치지 않는다”를 별도 QA 기준으로 둔다.

UX 기준선:

- Chrome 최신 안정 버전의 현재 `/search` UX를 기준선으로 삼는다.
- 허용 가능한 차이는 decorative effect 축소에 한정한다. 예: blur 미지원, visualizer idle fallback, album palette fallback.
- 허용하지 않는 차이는 핵심 정보/조작 손상이다. 예: 텍스트 겹침, fixed player가 목록을 가림, safe-area 침범, 선택 상태 혼동, fullscreen 닫기 불가, keyboard/touch 조작 충돌.

필수 UX 확인 항목:

| 영역             | 확인 내용                                                                                                          | 실패 기준                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Layout stability | 375px, 390px, 768px, 1024px, 1440px에서 `/search` list, detail aside, bottom player, bottom tab이 겹치지 않는다.   | 가로 스크롤, 잘린 버튼, fixed 영역이 콘텐츠를 가림                         |
| Visual hierarchy | 현재 곡, 선택 곡, 재생 중 상태, disabled control이 시각적으로 구분된다.                                            | 선택/재생/disabled 상태가 같은 톤으로 보여 사용자가 상태를 판단하기 어려움 |
| Touch UX         | 모바일 mini player, bottom tab, fullscreen controls, close bar의 터치 영역이 충분하고 오작동하지 않는다.           | 작은 hit area, tap과 drag가 충돌, 닫기 gesture가 우발적으로 실행           |
| Keyboard UX      | Space/Arrow shortcut은 입력/slider 조작과 충돌하지 않고, 버튼 focus ring이 보인다.                                 | page scroll 충돌, focus 위치 상실, focus 표시 제거                         |
| Motion UX        | fullscreen open/close, drag-dismiss, visualizer animation이 끊기지 않고 reduced-motion에서 과한 움직임이 줄어든다. | 500ms 이상 지연 체감, 끊김, reduced-motion 무시                            |
| Readability      | blur/backdrop fallback이 없어도 텍스트와 icon contrast가 유지된다.                                                 | 어두운 배경 위 텍스트가 읽히지 않거나 icon이 배경에 묻힘                   |
| Empty/error UX   | Cloudinary, IndexedDB, visualizer, album palette fallback 상태가 빈 영역이나 깨진 UI로 보이지 않는다.              | 아무 안내 없는 빈 패널, skeleton 무한 유지, 깨진 이미지 아이콘 노출        |

검증 흐름:

1. `/search` 기본 진입에서 목록 스크롤, 검색 입력, All/Recent 전환을 확인한다.
2. `/search?track=<id>` 딥링크에서 상세 패널 loading, fallback, player queue 주입을 확인한다.
3. 모바일 폭에서 row select가 즉시 재생되고, mini player에서 fullscreen 진입/닫기가 자연스러운지 확인한다.
4. 데스크탑 폭에서 row select는 상세 선택만 수행하고, fullscreen overlay가 하단 player와 충돌하지 않는지 확인한다.
5. `prefers-reduced-motion`, `matchMedia` 없음, `ResizeObserver` 없음, `IntersectionObserver` 없음, IndexedDB reject mock 상태에서 UI가 “기능 축소”로 보이는지 확인한다.

### 5.4 완료 기준

- `npm test` 통과
- `npm run lint` 통과
- `npm run build` 통과
- Chrome 기준 UI가 현재와 동등하게 유지
- 미지원 API mock 테스트에서 앱이 throw하지 않음
- 주요 breakpoint와 fullscreen/mobile 흐름에서 UX regression이 없음

---

## 6. 롤백 및 가드레일

- 오디오 재생 로직은 `AudioPlayerProvider`와 `audioInstance.ts` 경계 밖으로 흩뜨리지 않는다.
- analyser와 visualizer 실패는 오디오 재생 실패로 취급하지 않는다.
- Dexie 저장 실패는 사용자 흐름을 막지 않는다.
- viewport 분기는 Tailwind breakpoint와 `matchMedia` 결과가 충돌하지 않게 한 곳에서 검증한다.
- CSS fallback은 먼저 additive class 방식으로 적용하고, 대규모 스타일 재작성은 피한다.
- 새 브라우저 테스트 dependency는 P0/P1 개선 완료 후 별도 판단한다.

---

## 7. 문서 검토

### 7.1 모호성 점검

- "브라우저 호환성 개선"은 실제 코드 수정 가능한 설계로 제한했다.
- 지원 브라우저는 최신 안정 버전 중심으로 정의했고, IE 11은 제외했다.
- 시각 효과 실패와 핵심 재생 실패를 분리했다.

### 7.2 범위 점검

이번 문서는 구현 설계까지 다룬다. 실제 코드 수정은 다음 실행 계획에서 파일 단위로 나눈다.

### 7.3 코드베이스 검토 결과

- 문서의 기능 경계는 현재 FSD-ish 구조와 맞는다. `AudioPlayerProvider`, visualizer, `MusicShell`, shared hooks, Dexie repository 단위로 작업을 나누면 변경 영향이 명확하다.
- Interaction 섹션은 초기 문안보다 범위를 줄였다. `contentEditable`, `[role='slider']`, `pointercancel` 처리는 이미 코드에 있으므로 신규 구현이 아니라 회귀 테스트와 예외 방어가 중심이다.
- Canvas/landing 섹션도 일부 범위를 줄였다. album palette fallback과 Cobe resize fallback은 이미 있으므로, 남은 작업은 visualizer resize fallback과 fallback 시각 상태 검증이다.
- 가장 위험한 P0는 observer 미지원과 Dexie reject다. 둘 다 사용자 데이터나 브라우저 환경에 따라 즉시 앱 오류로 번질 수 있고, 현재 테스트가 얇다.
- `matchMedia` 통합은 기능 위험보다 유지보수 위험이 크다. P0 이후 P1로 진행한다.

### 7.4 주요 참조

- MDN AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- MDN viewport length units: https://developer.mozilla.org/en-US/docs/Web/CSS/length
- MDN backdrop-filter: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- MDN ResizeObserver: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- MDN IntersectionObserver: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
- MDN Canvas getImageData: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData
- MDN matchMedia: https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia

---

## 8. 작업 Task 분리

### Task 1: Observer 미지원 방어

우선순위: P0

파일:

- 수정: `src/shared/hooks/useInView.ts`
- 수정: `src/shared/hooks/useInfiniteScroll.ts`
- 테스트: `src/test/shared/hooks/useInView.test.tsx`
- 생성: `src/test/shared/hooks/useInfiniteScroll.test.tsx`

작업:

1. `useInView`에서 `typeof IntersectionObserver === "undefined"`이면 `setInView(true)` 후 observer 생성을 건너뛴다.
2. `useInfiniteScroll`에서 observer 미지원이면 `targetRef`만 반환하고 자동 `onIntersect` 호출을 하지 않는다.
3. observer 생성은 try/catch로 감싸 옵션 오류가 렌더 오류로 전파되지 않게 한다.
4. 테스트에서 `global.IntersectionObserver`를 임시로 `undefined`로 만들고 두 hook이 throw하지 않는지 검증한다.

완료 기준:

- `npm test -- src/test/shared/hooks/useInView.test.tsx src/test/shared/hooks/useInfiniteScroll.test.tsx` 통과
- observer 미지원 환경에서 lazy reveal 콘텐츠가 숨겨진 채 남지 않음

### Task 2: Visualizer resize fallback 보강

우선순위: P0

파일:

- 수정: `src/features/audio/components/visualizers/useCanvasAudioVisualizer.ts`
- 테스트: `src/test/features/audio/audioVisualizer.test.tsx`

작업:

1. `ResizeObserver`가 없으면 `window.addEventListener("resize", sync)` fallback을 등록한다.
2. cleanup에서 observer와 window listener를 동일하게 정리한다.
3. canvas context가 `null`이면 animation frame을 예약하지 않는 현재 동작을 회귀 테스트로 고정한다.
4. `ResizeObserver` 미지원 테스트에서 resize event를 dispatch하고 canvas size sync가 다시 호출되는지 확인한다.

완료 기준:

- `npm test -- src/test/features/audio/audioVisualizer.test.tsx` 통과
- `ResizeObserver` 없는 환경에서도 visualizer hook이 throw하지 않음

### Task 3: Dexie repository safe wrapper

우선순위: P0

파일:

- 수정: `src/shared/db/repositories/trackCacheRepo.ts`
- 수정: `src/shared/db/repositories/recentPlaysRepo.ts`
- 테스트: `src/shared/db/repositories/__tests__/trackCacheRepo.test.ts`
- 테스트: `src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts`
- 영향 확인: `src/widgets/musicShell/index.tsx`, `src/shared/providers/audioPlayerProvider.tsx`

작업:

1. `getCachedTrack` 실패는 `undefined`로 반환한다.
2. `getCachedTracks` 실패는 `[]`로 반환한다.
3. `cacheTrack` 실패는 throw하지 않고 개발 환경에서만 warning을 남긴다.
4. `getRecentPlays` 실패는 `[]`로 반환한다.
5. `addRecentPlay` 실패는 throw하지 않고 개발 환경에서만 warning을 남긴다.
6. repository 테스트에서 Dexie table method를 reject하도록 mock/spy 처리하고 각 기본값을 검증한다.

완료 기준:

- `npm test -- src/shared/db/repositories/__tests__/trackCacheRepo.test.ts src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts` 통과
- IndexedDB 실패가 `/search` 렌더링과 player control 렌더링을 막지 않음

### Task 4: Audio capability 상태 분리

우선순위: P0

파일:

- 수정: `src/shared/lib/audioInstance.ts`
- 수정: `src/app/store/audioInstanceStore.ts`
- 수정: `src/shared/types/dataType.ts`
- 테스트: `src/test/shared/providers/audioPlayerProvider.test.tsx`

작업:

1. audio singleton 결과에 capability 객체를 추가한다.
2. capability 최소 필드는 `audioElementAvailable`, `audioContextAvailable`, `analyserAvailable`, `initializationError`로 둔다.
3. `audioInstanceStore`에서 capability를 provider가 읽을 수 있게 노출한다.
4. `AudioContext`가 없거나 analyser 생성이 실패하는 mock에서도 provider가 렌더링되는지 테스트한다.

완료 기준:

- `npm test -- src/test/shared/providers/audioPlayerProvider.test.tsx` 통과
- analyser가 없어도 재생 UI는 렌더링되고 visualizer만 idle 상태로 남음

### Task 5: 재생 실패 상태 보관

우선순위: P0

파일:

- 수정: `src/shared/providers/audioPlayerProvider.tsx`
- 수정: `src/shared/types/dataType.ts`
- 테스트: `src/test/shared/providers/audioPlayerProvider.test.tsx`

작업:

1. provider 상태에 `playbackError`를 추가한다.
2. `audioContext.resume()` 실패는 `unsupported-audio-context` 또는 `autoplay-blocked`로 분류한다.
3. `audio.play()` reject는 `autoplay-blocked` 또는 `source-load-failed`로 분류하고 `isPlaying=false`로 복구한다.
4. 성공적인 재생 시 `playbackError=null`로 초기화한다.
5. 테스트에서 `audio.play` reject와 `audioContext.resume` reject를 각각 검증한다.

완료 기준:

- `npm test -- src/test/shared/providers/audioPlayerProvider.test.tsx` 통과
- 재생 실패 후 UI 상태가 “재생 중”으로 남지 않음

### Task 6: `matchMedia` 공통 hook 도입

우선순위: P1

파일:

- 생성: `src/shared/hooks/useMediaQuery.ts`
- 수정: `src/widgets/musicShell/index.tsx`
- 수정: `src/features/audio/ui/audioPlayer.tsx`
- 테스트: `src/test/widgets/musicShell.test.tsx`
- 테스트: `src/test/features/audio/audioPlayer.test.tsx`

작업:

1. `useMediaQuery(query, defaultValue)` hook을 만든다.
2. `window.matchMedia`가 없으면 `defaultValue`를 유지한다.
3. `addEventListener/removeEventListener`가 있으면 우선 사용하고, 없으면 legacy `addListener/removeListener`를 사용한다.
4. `MusicShell`의 row select 재생 분기와 `AudioPlayer`의 fullscreen viewport 분기를 새 hook으로 교체한다.
5. `window.matchMedia`가 없는 테스트를 추가해 기본 레이아웃이 렌더링되는지 검증한다.

완료 기준:

- `npm test -- src/test/widgets/musicShell.test.tsx src/test/features/audio/audioPlayer.test.tsx` 통과
- 767px/768px 경계 동작이 기존과 동일함

### Task 7: Dynamic viewport와 blur fallback 점검

우선순위: P1

파일:

- 수정: `src/widgets/musicShell/index.tsx`
- 수정: `src/features/audio/components/desktopFullscreenPlayer.tsx`
- 수정: `src/shared/styles/global.css`
- 테스트: `src/test/widgets/musicShell.test.tsx`
- 테스트: `src/test/features/audio/audioPlayer.test.tsx`

작업:

1. `h-[100dvh]`, `max-h-[100dvh]`, `min-h-dvh` 사용 위치에 `h-screen`, `max-h-screen`, `min-h-screen` fallback을 additive class로 추가한다.
2. `backdrop-blur-*` 사용 위치의 배경색 alpha가 blur 없이도 텍스트를 읽을 수 있는지 점검하고 필요한 경우 더 불투명한 fallback 배경을 적용한다.
3. class 존재 중심의 Jest 테스트를 보강한다.

완료 기준:

- `npm test -- src/test/widgets/musicShell.test.tsx src/test/features/audio/audioPlayer.test.tsx` 통과
- blur 미지원에서도 버튼/텍스트 대비가 유지됨

### Task 8: Landing Cobe fallback 회귀 테스트

우선순위: P1

파일:

- 수정: `src/test/features/landing/landingCobeOrbit.test.tsx`
- 검토: `src/features/landing/ui/landingCobeOrbit.tsx`

작업:

1. `createGlobe`가 throw하는 테스트를 추가한다.
2. 실패해도 `.rose-cobe-orbit__halo`, canvas, label이 렌더링되는지 검증한다.
3. `prefers-reduced-motion: reduce`일 때 `requestAnimationFrame`이 호출되지 않는 테스트를 추가한다.

완료 기준:

- `npm test -- src/test/features/landing/landingCobeOrbit.test.tsx` 통과
- Cobe/WebGL 실패가 landing hero의 빈 영역으로 보이지 않음

### Task 9: Interaction 회귀 테스트 보강

우선순위: P1

파일:

- 수정: `src/test/features/audio/audioKeyboardShortcuts.test.tsx`
- 수정: `src/test/features/audio/audioPlayer.test.tsx`
- 검토: `src/features/audio/components/mobile/mobileFullscreenPlayer.tsx`

작업:

1. `contentEditable`, `[role='slider']`, range input focused 상태에서 Space/Arrow shortcut이 실행되지 않는지 검증한다.
2. 모바일 fullscreen에서 `pointercancel`이 발생하면 drag 상태가 정리되는지 검증한다.
3. `setPointerCapture` 또는 `releasePointerCapture`가 없는 환경을 mock해 예외가 필요하면 guard를 추가한다.

완료 기준:

- `npm test -- src/test/features/audio/audioKeyboardShortcuts.test.tsx src/test/features/audio/audioPlayer.test.tsx` 통과
- 명시적 click/tap 재생 버튼은 shortcut 차단과 무관하게 동작함

### Task 10: 브라우저 QA 체크리스트 작성

우선순위: P2

파일:

- 생성: `docs/plans/2026-06-29-browser-compatibility-qa-checklist.md`

작업:

1. Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome별 수동 확인 항목을 작성한다.
2. `/search`, `/search?track=<id>`, Recent view, desktop fullscreen, mobile fullscreen, visualizer fallback, IndexedDB 실패 관찰 항목을 포함한다.
3. 375px, 390px, 768px, 1024px, 1440px viewport별 UX 확인 항목을 포함한다.
4. layout overlap, horizontal scroll, fixed player 침범, safe-area, touch target, focus ring, reduced-motion, text/icon contrast를 체크 항목으로 둔다.
5. Chrome 기준 screenshot과 비교해 허용 가능한 decorative 차이와 허용하지 않는 UX regression을 분리한다.
6. P0/P1 완료 후 실행할 명령 `npm test`, `npm run lint`, `npm run build`를 체크리스트에 넣는다.

완료 기준:

- QA 체크리스트가 브라우저별 기대 결과와 실패 시 확인할 코드 경로를 포함함
- QA 체크리스트가 기능 결과와 UX 영향 결과를 분리해 기록할 수 있음
- P0/P1 구현 후 수동 검증에 바로 사용할 수 있음
