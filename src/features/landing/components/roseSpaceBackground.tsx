import { DustySnow } from "./dustySnow";

export default function RoseSpaceBackground() {
  return (
    <div
      className="rose-space-background"
      data-testid="rose-space-background"
      aria-hidden="true"
    >
      <DustySnow />
    </div>
  );
}