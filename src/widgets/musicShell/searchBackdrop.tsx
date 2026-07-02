const EDGE_PHRASE =
  "EDMM ARCHIVE — SOUND & VISION • EDMM ARCHIVE — SOUND & VISION • EDMM ARCHIVE — SOUND & VISION •";

/*
  /search 배경 장식 — 검은 배경 위에 아주 낮은 투명도의 흰색 문양.
  필름 그레인 + 좌우 엣지 마이크로 레터링 조합.
  순수 장식이므로 aria-hidden + pointer-events 차단.
*/
export function SearchBackdrop() {
  return (
    <div aria-hidden="true" className="search-backdrop">
      <div className="search-backdrop__grain" />
      <span className="search-backdrop__edge search-backdrop__edge--left">
        {EDGE_PHRASE}
      </span>
      <span className="search-backdrop__edge search-backdrop__edge--right">
        {EDGE_PHRASE}
      </span>
    </div>
  );
}

export default SearchBackdrop;
