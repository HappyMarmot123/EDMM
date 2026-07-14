<p align="center">
  <a href="https://edmm.vercel.app/" aria-label="Open EDMM">
    <img src="public/v2_screenshot.png" alt="EDMM V2 메인 음악 셸" width="100%" />
  </a>
</p>

<table>
  <tr>
    <td width="50%">
      <img src="public/v2_mobile_fullscreen.png" alt="EDMM V2 모바일 전체 화면 플레이어" width="100%" style="max-height: 400px; object-fit: contain;" />
    </td>
    <td width="50%">
      <img src="public/v2_desktop_fullscreen.png" alt="EDMM V2 데스크톱 전체 화면 플레이어" width="100%" style="max-height: 400px; object-fit: contain;" />
    </td>
  </tr>
</table>

<h1 align="center">EDMM</h1>

<h3 align="center">
  Electronic Dance Music Marmot
</h3>
<h4 align="center">
  정해진 흐름대로 흘러가는 쇼에서 즐기는 사람이 되어보세요. <br/> 매화꽃 기운이 당신과 함께하기를.
</h4>

<p align="center">
  Spotify와 SoundCloud에서 영감을 받은 반응형 웹 음악 플레이어입니다.<br />
  Pop과 EDM 카탈로그 탐색, 딥 링크 검색, 상시 노출 글로벌 플레이어, 반응형 전체 화면 재생을 제공합니다.
</p>

<p align="center">
  <a href="https://edmm.vercel.app/"><img src="https://img.shields.io/badge/Live-edmm.vercel.app-FF98A2" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.2.9-14121B?logo=nextdotjs&logoColor=white" alt="Next.js 16.2.9" />
  <img src="https://img.shields.io/badge/React-19.2.7-FD6D94?logo=react&logoColor=white" alt="React 19.2.7" />
  <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6.0.3" />
</p>


## 📱 네이티브 모바일 앱 (Flutter)

EDMM은 웹뿐 아니라 **Flutter 기반 네이티브 모바일 앱**으로도 제공됩니다. 동일한 Pop/EDM 카탈로그 탐색·검색·몰입형 재생 경험을 모바일에 맞춰 재구성했으며, `just_audio` · `audio_service` 기반으로 백그라운드 오디오, 비주얼라이저, 이퀄라이저 프리셋을 지원합니다.

| 항목 | 내용 |
| --- | --- |
| 저장소 | [github.com/HappyMarmot123/EDMM-flutter](https://github.com/HappyMarmot123/EDMM-flutter) |
| 플랫폼 | Android · iOS |
| 프레임워크 | Flutter 3.44.5 (stable), Dart SDK `^3.12.2` |
| 오디오 | `just_audio`, `audio_service` (백그라운드 재생 · 비주얼라이저 · EQ 프리셋) |
| 상태/라우팅 | `provider`, `go_router` |
| 관측성 | `sentry_flutter` |
| 상태 | MVP Complete |

**다운로드:** [EDMM Android APK](https://drive.google.com/file/d/11P3CSfOMK0znpoCdmEu0vi4CDGtfr9FT/view?usp=sharing)

> 웹 앱은 Android 기기에서 접속 시 앱 설치 팝업과 헤더의 **App Download** 버튼으로 이 APK를 안내합니다.

## ⌨️ 키보드 단축키

키보드 단축키는 글로벌 오디오 위젯 경계에서 한 번만 등록되며, 입력 필드 입력/버튼, 링크, 슬라이더 조작 중에는 무시됩니다.

| 키 | 동작 |
| --- | --- |
| `Space` | 재생 / 일시정지 |
| `ArrowLeft` | 10초 뒤로 이동 |
| `ArrowRight` | 10초 앞으로 이동 |
| `ArrowUp` | 볼륨 올리기 |
| `ArrowDown` | 볼륨 낮추기 |

## 📐 반응형 규칙

| 뷰포트 | 동작 |
| --- | --- |
| `< 768px` | 모바일 플레이어, 모바일 전체 화면, 하단 탭, 사이드바 없음, 행 선택 즉시 재생 |
| `768px - 1024px` | 데스크톱 플레이어, 축소 가능한 사이드바, 행 선택 시 선택만 적용 |
| `>= 1025px` | 데스크톱 플레이어, 항상 표시되는 사이드바, 행 선택 시 선택만 적용 |

- 모바일 전체 화면에는 앨범 아트워크, 트랙 메타데이터, 탐색 가능한 진행바, 현재/총 재생 시간, 셔플, 이전/다음, 재생/일시정지 제어가 포함됩니다.
- 미니 플레이어를 탭하면 모바일 전체 화면 재생으로 전환되고, 상단 화살표 클릭 또는 상단 닫기 바 드래그로 전체 화면이 닫힙니다.

## 📊 성능

`feature/optimization-roadmap` 브랜치에서 랜딩 페이지와 `/search` 카탈로그의 Lighthouse 지표를 실측·개선했습니다(2026-07-06 기준).

| 경로 | 점수 (전→후) | LCP (전→후) | CLS | 상태 |
| --- | --- | --- | --- | --- |
| `/` | 59 → 91 (+32) | 3997ms → 2965ms (-1032ms) | 0 → 0 | PASS |
| `/search?view=all` | 68 → 96 (+28) | 3683ms → 2572ms (-1111ms) | 0 → 0 | PASS |

<details>
<summary>성능·관측성 개선 상세 (feature/optimization-roadmap)</summary>

## ✨ 주요 기능

- **글로벌 오디오 플레이어** — `AudioPlayerProvider`와 `src/widgets/audioPlayer`를 통해 라우트 전환과 무관하게 상시 유지되는 영구 플레이어.
- **반응형 전체 화면 재생** — 앨범 아트워크, CD 아트 처리, 리퀴드 글래스 패널, 앨범 톤 기반 시각화가 적용된 데스크톱 전체 화면 모드.
- **딥 링크 검색** — `/search?track=<id>` 형태로 정규화된 트랙 라우트.
- **모바일 최적화 경험** — 미니 플레이어 탭으로 전체 화면 전환, 탐색 가능한 진행바, 셔플·이전/다음·재생/일시정지 제어.
- **캔버스 시각화** — 공유 렌더 루프 기반의 안정적인 오디오 비주얼라이저(일반/전체 화면 분리, 앨범 톤 컬러 추출).
- **운영 안정성** — Sentry 모니터링, 타입 기반 검색/카탈로그 폴백, 재생 에러 분류 및 사용자 재시도 피드백.

## 🛠️ 기술 스택

| 항목 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16.2.9 (App Router, Turbopack) |
| UI 런타임 | React 19.2.7 / React DOM 19.2.7 |
| 언어 | TypeScript 6.0.3 |
| 스타일링 | Tailwind CSS 4.3.1 (`@tailwindcss/postcss`) |
| 서버 상태 | TanStack Query 5.101.1 |
| 클라이언트 상태 | Zustand 5.0.14 |
| 로컬 데이터베이스 | Dexie 4.4.4 + dexie-react-hooks 4.4.0 (IndexedDB) |
| 미디어 관리 | Cloudinary |
| 대용량 리스트 | react-virtuoso |
| 테스트 | Jest 30.0.4, jest-environment-jsdom 30.0.4, React Testing Library 16.3.0, user-event 14.6.1, fake-indexeddb |
| 관측성 | Sentry, Vercel Speed Insights |

아키텍처(FSD, Feature-Sliced Design) 기반으로 컴포넌트 설계·상태 관리·성능 최적화를 구성했습니다. 상세 아키텍처 문서는 [`docs/architecture/README.md`](docs/architecture/README.md)에서 관리됩니다.

#### 완료된 작업

- 클라이언트, 서버, 엣지, 라우트, 글로벌 에러 경로에 대해 Sentry 모니터링을 추가했습니다.
- Vercel Speed Insights와 실환경/로컬 Lighthouse 측정 스크립트를 추가해 성능을 실측할 수 있게 했습니다.
- 랜딩/검색 런타임 비용을 줄이기 위해 미디어 무거운 UI를 지연 로드하고, 아트워크 로딩과 provider 동작을 최적화했습니다.
- Cloudinary 또는 IndexedDB 실패 시 사용자 컨텍스트를 유지하는 타입 기반 검색/카탈로그 폴백 상태 모델을 추가했습니다.
- `/search` 복구 가능한 실패 상황에서 팝업 알림이 레이아웃 점프 없이 표시되도록 하여 플레이어 목록, 상세 사이드바, 플레이어 바, 전체 화면 영역의 안정성을 유지했습니다.
- 재생 에러 분류 체계, 사용자 재시도 피드백, Sentry 이벤트 정규화를 추가했습니다.
- 데스크톱/모바일 전체 화면 플레이어를 지연 로드하고 브라우저 유휴 상태에서 글로벌 오디오 위젯을 마운트하도록 변경했습니다.
- 시각화기의 프레임 예산, DPR 제한, 숨겨진 문서 렌더링 성능 가드를 추가했습니다.

#### 아키텍처 변경

- 관측성은 Sentry 초기화, 이벤트 정규화, 타입 기반 분류 헬퍼, 기능 단위 캡처 호출로 이어지는 전용 체인으로 정리했습니다.
- `/search` 폴백 동작은 `catalogFallbackState`로 모델링해 `visibleTracks`, 팝업 `notice`, 상태 결정을 UI 표현과 분리했습니다.
- 재생 에러 처리는 `AudioPlayerProvider`에서 일괄 담당하며 데스크톱/모바일 플레이어는 공통 `PlaybackErrorFeedback`을 사용합니다.
- 전체 화면 플레이어는 열 때만 `next/dynamic(..., { ssr: false })`로 로드합니다.
- 오디오 플레이어 위젯은 동적 import 후 브라우저 유휴 시점에 마운트해 라우트의 핵심 번들에서 플레이어 크롬을 분리했습니다.
- 캔버스 오디오 시각화기는 기본 30fps 렌더 예산을 적용하고 DPR을 2로 상한하여, 문서가 숨겨진 상태에서는 실시간 분석기 읽기를 일시 중지합니다.
- 로컬 Lighthouse 측정은 Windows에서도 안정적으로 동작하는 러너를 두고, 요약 스크립트와 동일한 manifest 형태로 결과를 저장합니다.

</details>

---

## 📜 프로젝트 이력

- **진행 기간:** 2025년 5월 ~ (V2 업그레이드 진행 중)
- **참여 인원:** 1인 (개인 프로젝트)

<details>
<summary>V1 → V2 업그레이드 요약</summary>

EDMM V2는 상시 노출 글로벌 오디오 플레이어, 딥 링크 기반 검색, 반응형 전체 화면 재생, 더 정돈된 뮤직 셸 아키텍처를 새로 적용했습니다.

#### 스택 마이그레이션

| 항목 | V1 | V2 |
| --- | --- | --- |
| 프레임워크 | Next.js 15 | Next.js 16.2.9 (App Router, Turbopack) |
| UI 런타임 | React 19 | React 19.2.7 / React DOM 19.2.7 |
| 언어 | TypeScript | TypeScript 6.0.3 |
| 스타일링 | Tailwind CSS | Tailwind CSS 4.3.1 (`@tailwindcss/postcss`) |
| 서버 상태 | TanStack Query | TanStack Query 5.101.1 |
| 클라이언트 상태 | Zustand | Zustand 5.0.14 |
| 로컬 데이터베이스 | IndexedDB concept | Dexie 4.4.4 + dexie-react-hooks 4.4.0 |
| 테스트 | Jest + RTL | Jest 30.0.4, jsdom 30.0.4, RTL 16.3.0, user-event 14.6.1 |

#### V2에서 추가·강화

- 트랙 캐시와 최근 재생 목록을 위한 Dexie 기반 IndexedDB 리포지토리를 추가했습니다.
- 대규모 트랙 목록을 위한 가상화 라이브러리 react-virtuoso를 도입했습니다.
- IndexedDB 리포지토리 테스트를 위해 fake-indexeddb를 추가했습니다.
- 업데이트된 TypeScript 테스트/빌드 워크플로우에 맞춰 tsx, typescript-eslint, 최신 ESLint 도구를 추가했습니다.

#### V1 방향에서 제거

- Supabase를 기존 활성 DB/BaaS 방향에서 제거했습니다.
- Drizzle ORM과 drizzle-kit를 활성 스키마/마이그레이션 의존성에서 제거했습니다.
- `/search?track=<id>`로 트랙 라우트를 정규화해 상세 페이지 직접 재생 플로우를 제거했습니다.

</details>

<details>
<summary>V1 (Deprecated) — 원본 README</summary>

> 아래 섹션은 원본 V1 README를 프로젝트 이력 보관을 위해 남겨 둡니다. 더 이상 사용되지 않는 아키텍처·의존성·API·스크린샷이 언급될 수 있습니다. 현재 제품 방향은 위의 V2 문서를 기준으로 확인하세요.

### 💡 Project Introduction

EDMM은 Next.js 기반의 인터랙티브 음악 스트리밍 웹 애플리케이션입니다. Spotify와 SoundCloud에서 영감을 받아 사이드 프로젝트로 개발하였습니다. 사용자 친화적인 인터페이스와 실시간 음악 재생 기능을 중심으로 생동감 있는 음악 경험을 제공합니다.

**Architecture:** 견고하고 확장 가능한 개발을 위해 **FSD**(Feature-Sliced Design) 아키텍처를 채택했습니다.

#### Tech Stack (V1)

- **Core:** TypeScript, Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Backend & Database:** Supabase (BaaS/DB), Drizzle ORM, Cloudinary
- **State / Testing:** Zustand, TanStack Query, Jest, React Testing Library

#### 주요 패턴과 기법 (V1)

- **컴포넌트 설계:** Presentation & Container, Adapter, Compound, Configuration Object, HOC, Factory, Facade, Builder, Mediator, 역할 기반 패턴 등.
- **성능 최적화:** 서버/클라이언트 컴포넌트 분리, `next/image` 기반 이미지 최적화(WebP·리사이징·지연 로딩), FSD + 라우트 기반 코드 스플리팅.
- **백엔드/DB:** Drizzle ORM 기반 타입 안전 스키마·쿼리, drizzle-kit 마이그레이션.

</details>
