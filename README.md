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

# EDMM V2 Upgrade!

EDMM은 Spotify의 청취 방식에서 영감을 받은 반응형 웹 음악 플레이어입니다. V2는 상시 노출되는 글로벌 오디오 플레이어, 딥 링크 기반 검색, 반응형 전체 화면 재생, 더 정돈된 뮤직 셸 아키텍처를 새로 적용합니다.

### What changed in V2

- `AudioPlayerProvider` 및 `src/widgets/audioPlayer`를 통해 영구적인 글로벌 플레이어를 추가했습니다.
- 앨범 아트워크, CD 아트 처리, 리퀴드 글래스 패널, 앨범 톤 시각화 효과가 들어간 데스크톱 전체 화면 모드를 추가했습니다.
- 다양한 디바이스(태블릿/모바일 포함)에서 사용할 수 있도록 반응형 디자인을 개선하고 레이아웃 불안정성을 줄였습니다.
- 비즈니스 로직을 강화해 사이드 이펙트를 줄이고 회귀 안정성을 높였습니다.

### Performance and visualizer upgrades

- 모바일 미니 플레이어의 초기 화면에서 미디어 무거운 전체 화면 UI를 제외하고 음악 셸 메인 영역을 단순화해 체감 LCP를 개선했습니다.
- 플레이어/리스트/상세 영역을 안정적으로 예약하고 초기 트랙 준비와 카탈로그 하이드레이션 중 레이아웃 점프를 제거해 CLS를 개선했습니다.
- 트랙 선택, 큐 하이드레이션, 플레이어 동기화에서 부수효과를 줄여 INP를 개선했습니다.
- 캔버스 기반 시각화 루프를 공유해 프레임 안정성을 개선했습니다.
- 공통 렌더링 로직을 공유하되 일반/전체 화면 시각화 컴포넌트를 분리했습니다.
- 전체 화면 시각화기에 앨범 톤 컬러 추출을 추가해 현재 아트워크 기반 색상이 반영되도록 개선했습니다.

### Responsive rules

| 뷰포트 | 동작 |
| --- | --- |
| `< 768px` | 모바일 플레이어, 모바일 전체 화면, 하단 탭, 사이드바 없음, 행 선택 즉시 재생 |
| `768px - 1024px` | 데스크톱 플레이어, 축소 가능한 사이드바, 행 선택 시 선택만 적용 |
| `>= 1025px` | 데스크톱 플레이어, 항상 표시되는 사이드바, 행 선택 시 선택만 적용 |

### Mobile experience

- 모바일 전체 화면에는 앨범 아트워크, 트랙 메타데이터, 탐색 가능한 진행바, 현재 재생 시점, 총 재생 시간, 셔플, 이전/다음, 재생/일시정지 제어가 포함됩니다.
- 미니 플레이어를 탭하면 모바일 전체 화면 재생으로 전환되고, 상단 화살표 클릭 또는 상단 닫기 바 드래그로 전체 화면이 닫힙니다.

### Optimization roadmap branch summary (2026-07-06)

`feature/optimization-roadmap` 브랜치는 운영 모니터링, 런타임 폴백 동작, 전체 화면/시각화 성능, 랜딩 페이지와 주요 `/search` 카탈로그의 Lighthouse 개선 측정을 중심으로 진행했습니다.

#### Work completed

- 클라이언트, 서버, 엣지, 라우트, 글로벌 에러 경로에 대해 Sentry 모니터링을 추가했습니다.
- Vercel Speed Insights와 실환경/로컬 Lighthouse 측정 스크립트를 추가해 성능을 실측할 수 있게 했습니다.
- 랜딩/검색 런타임 비용을 줄이기 위해 미디어 무거운 UI를 지연 로드하고, 아트워크 로딩과 provider 동작을 최적화했습니다.
- Cloudinary 또는 IndexedDB 실패 시 사용자 컨텍스트를 유지하는 타입 기반 검색/카탈로그 폴백 상태 모델을 추가했습니다.
- `/search` 복구 가능한 실패 상황에서 팝업 알림이 레이아웃 점프 없이 표시되도록 하여 플레이어 목록, 상세 사이드바, 플레이어 바, 전체 화면 영역의 안정성을 유지했습니다.
- 재생 에러 분류 체계, 사용자 재시도 피드백, Sentry 이벤트 정규화를 추가했습니다.
- 데스크톱/모바일 전체 화면 플레이어를 지연 로드하고 브라우저 유휴 상태에서 글로벌 오디오 위젯을 마운트하도록 변경했습니다.
- 시각화기의 프레임 예산, DPR 제한, 숨겨진 문서 렌더링 성능 가드를 추가했습니다.

#### Architecture changes

- 관측성은 Sentry 초기화, 이벤트 정규화, 타입 기반 분류 헬퍼, 기능 단위 캡처 호출로 이어지는 전용 체인으로 정리했습니다.
- `/search` 폴백 동작은 `catalogFallbackState`로 모델링해 `visibleTracks`, 팝업 `notice`, 상태 결정을 UI 표현과 분리했습니다.
- 재생 에러 처리는 `AudioPlayerProvider`에서 일괄 담당하며 데스크톱/모바일 플레이어는 공통 `PlaybackErrorFeedback`을 사용합니다.
- 전체 화면 플레이어는 열 때만 `next/dynamic(..., { ssr: false })`로 로드합니다.
- 오디오 플레이어 위젯은 동적 import 후 브라우저 유휴 시점에 마운트해 라우트의 핵심 번들에서 플레이어 크롬을 분리했습니다.
- 캔버스 오디오 시각화기는 기본 30fps 렌더 예산을 적용하고 DPR을 2로 상한하여, 문서가 숨겨진 상태에서는 실시간 분석기 읽기를 일시 중지합니다.
- 로컬 Lighthouse 측정은 Windows에서도 안정적으로 동작하는 러너를 두고, 요약 스크립트와 동일한 manifest 형태로 결과를 저장합니다.

#### Performance before and after

| 경로 | 개선 전 | 개선 후 | 차이 | 개선 전 LCP | 개선 후 LCP | 차이 | CLS | 상태 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 59 | 91 | +32 | 3997ms | 2965ms | -1032ms | 0 -> 0 | PASS |
| `/search?view=all` | 68 | 96 | +28 | 3683ms | 2572ms | -1111ms | 0 -> 0 | PASS |

## V1 -> V2 tech stack migration

| 항목 | V1 | V2 |
| --- | --- | --- |
| 프레임워크 | Next.js 15 | Next.js 16.2.9 with App Router and Turbopack build/dev scripts |
| UI 런타임 | React 19 | React 19.2.7 / React DOM 19.2.7 |
| 언어 | TypeScript | TypeScript 6.0.3 |
| 스타일링 | Tailwind CSS | Tailwind CSS 4.3.1 with `@tailwindcss/postcss` |
| 서버 상태 | TanStack Query | TanStack Query 5.101.1 |
| 클라이언트 상태 | Zustand | Zustand 5.0.14 |
| 로컬 데이터베이스 | IndexedDB concept | Dexie 4.4.4 + dexie-react-hooks 4.4.0 |
| 테스트 | Jest + React Testing Library | Jest 30.0.4, jest-environment-jsdom 30.0.4, React Testing Library 16.3.0, user-event 14.6.1 |

### Added or strengthened in V2

- 트랙 캐시와 최근 재생 목록을 위한 Dexie 기반 IndexedDB 리포지토리를 추가했습니다.
- 대규모 트랙 목록을 위한 가상화 라이브러리 react-virtuoso를 도입했습니다.
- IndexedDB 리포지토리 테스트를 위해 fake-indexeddb를 추가했습니다.
- 업데이트된 TypeScript 테스트/빌드 워크플로우에 맞춰 tsx, typescript-eslint, 최신 ESLint 도구를 추가했습니다.

### Removed from the V1 direction

- Supabase를 기존 활성 DB/BaaS 방향에서 제거했습니다.
- Drizzle ORM과 drizzle-kit를 활성 스키마/마이그레이션 의존성에서 제거했습니다.
- `/search?track=<id>`로 트랙 라우트를 정규화해 상세 페이지 직접 재생 플로우를 제거했습니다.

### Keyboard shortcuts

키보드 단축키는 글로벌 오디오 위젯 경계에서 한 번만 등록되며, 입력 필드 입력/버튼, 링크, 슬라이더 조작 중에는 무시됩니다.

| 키 | 동작 |
| --- | --- |
| `Space` | 재생 / 일시정지 |
| `ArrowLeft` | 10초 뒤로 이동 |
| `ArrowRight` | 10초 앞으로 이동 |
| `ArrowUp` | 볼륨 올리기 |
| `ArrowDown` | 볼륨 낮추기 |

현재 아키텍처 문서는 다음 위치에서 관리됩니다: docs/architecture/README.md

## V1 Deprecated - Original README

아래 섹션은 원본 V1 README를 프로젝트 이력 보관을 위해 남겨 둡니다. 첫 번째 EDMM 구현을 설명하며, 더 이상 사용되지 않는 아키텍처·의존성·API·스크린샷이 언급될 수 있습니다. 현재 제품 방향, 런타임 동작, 스택 업그레이드가 필요할 때는 위의 V2 문서를 기준으로 확인하세요.

<a href="https://edmm.vercel.app/" alt="Join EDMM" style="display: flex; flex-direction: row;">
 <img src="public/web_screenshot.png" alt="프로젝트 웹 화면" style="width: 800px; height: auto; margin-right: 10px;">
<!--  <img src="public/mobile_screenshot.png" alt="프로젝트 모바일 화면" style="width: 300px; height: auto;"> -->
</a>

# 🎵 EDMM: Electronic Dance Music Marmot   
### 💡 Project Introduction  
EDMM은 Next.js 기반의 인터랙티브 음악 스트리밍 웹 애플리케이션입니다.   
Spotify와 SoundCloud에서 영감을 받아 사이드 프로젝트로 개발하였습니다.   
사용자 친화적인 인터페이스와 실시간 음악 재생 기능을 중심으로 생동감 있는 음악 경험을 제공합니다.  

**Architecture**: 견고하고 확장 가능한 개발을 위해 **FSD**(Feature-Sliced Design) 아키텍처를 채택했습니다.   
컴포넌트 설계부터 상태 관리, 성능 최적화에 이르기까지 최신 웹 개발 패턴과 기법을 적극적으로 활용했습니다.  

- 진행 기간: 2025년 5월 ~ 2025년 7월
- 참여 인원: 1인 (개인 프로젝트)  
  

## 🛠️ Tech Stack  
### Core
- 언어: TypeScript
- 프레임워크: Next.js 15
- UI 라이브러리: React 19
- 스타일링: Tailwind CSS
- 애니메이션: Framer Motion

### Backend & Database
- BaaS: Supabase
- 데이터베이스: Supabase
- ORM: Drizzle ORM
- 미디어 관리: Cloudinary

### State Management / Testing
- 클라이언트 상태: Zustand
- 서버 상태: TanStack Query (React Query)
- 프레임워크: Jest
- 라이브러리: React Testing Library

## 🧩 Major patterns and techniques
### 1. Component Design Patterns  
다양한 디자인 패턴을 활용해 컴포넌트의 재사용성과 유지보수성을 높였습니다.  

Presentation & Container 패턴  
Adapter, Compound, Configuration Object 패턴  
HOC(Higher-Order Component) 패턴  
Factory, Facade, Builder, Mediator 패턴  
역할 기반 패턴 등  

### 2. Performance Optimization
서버/클라이언트 컴포넌트를 분리하고 Next.js App Router의 핵심 기능을 활용해 서버 렌더링 이점을 극대화했으며, 클라이언트 번들 크기를 최소화했습니다.
이미지 최적화 (next/image): WebP 변환, 리사이징, 지연 로딩을 적용해 초반 로딩 성능을 개선했습니다.
코드 스플리팅: FSD 구조와 Next.js의 라우트 기반 분할 로딩을 통해 사용자가 필요한 코드만 받아오도록 구현했습니다.

### 3. Backend and Database
타입 안전 ORM (Drizzle ORM): TypeScript와 밀접하게 통합된 Drizzle ORM을 통해 컴파일 타임 오류를 더 빨리 잡을 수 있는 안전한 스키마와 쿼리를 구성했습니다.
데이터베이스 마이그레이션 (drizzle-kit): 스키마 변경 이력을 일관되게 관리해 안정적으로 DB를 업데이트합니다.
