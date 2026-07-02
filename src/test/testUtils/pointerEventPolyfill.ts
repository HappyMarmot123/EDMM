// jsdom에는 PointerEvent 생성자가 없어 fireEvent.pointer*가 clientX 없는
// 일반 Event로 폴백한다. MouseEvent 기반 폴리필로 좌표를 보존한다.
class PointerEventPolyfill extends MouseEvent {
  public pointerId: number;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
  }
}

export const installPointerEventPolyfill = () => {
  if (typeof window.PointerEvent === "undefined") {
    window.PointerEvent =
      PointerEventPolyfill as unknown as typeof PointerEvent;
  }
};
