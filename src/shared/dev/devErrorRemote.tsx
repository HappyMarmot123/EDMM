"use client";

import { AlertTriangle, Bug, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  DEV_ERROR_MOCK_SCENARIOS,
  runDevErrorMockScenario,
  type DevErrorMockResult,
  type DevErrorMockScenarioId,
} from "./errorMockScenarios";

export default function DevErrorRemote() {
  const [shouldThrowRouteError, setShouldThrowRouteError] = useState(false);
  const [lastResult, setLastResult] = useState<DevErrorMockResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (shouldThrowRouteError) {
    throw new Error("EDMM_DEV_REMOTE_ROUTE_RENDER_FAILED");
  }

  const handleRunScenario = (scenarioId: DevErrorMockScenarioId) => {
    if (scenarioId === "route_render_failed") {
      setShouldThrowRouteError(true);
      return;
    }

    setLastResult(runDevErrorMockScenario(scenarioId));
  };

  return (
    <section
      aria-label="Development error remote"
      data-testid="dev-error-remote"
      role="region"
      className="fixed bottom-4 left-4 z-[90] w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[#ff98a2]/40 bg-[#09060a]/95 p-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <Bug size={16} strokeWidth={2.2} aria-hidden="true" />
        <h2 className="text-xs font-black uppercase tracking-normal">
          Dev error remote
        </h2>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? "Collapse remote panel" : "Expand remote panel"}
          aria-expanded={isExpanded}
          data-testid="dev-error-remote-toggle"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/12 bg-white/[0.06] transition-colors hover:border-[#ff98a2]/55 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
        >
          {isExpanded ? (
            <ChevronDown size={14} strokeWidth={2.1} aria-hidden="true" />
          ) : (
            <ChevronUp size={14} strokeWidth={2.1} aria-hidden="true" />
          )}
        </button>
      </div>
      {isExpanded ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEV_ERROR_MOCK_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                title={scenario.description}
                data-testid={`dev-error-remote-${scenario.id}`}
                onClick={() => handleRunScenario(scenario.id)}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-white/12 bg-white/[0.06] px-2 text-xs font-black text-white/82 transition-colors hover:border-[#ff98a2]/55 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
              >
                <AlertTriangle size={14} strokeWidth={2.1} aria-hidden="true" />
                <span>{scenario.label}</span>
              </button>
            ))}
          </div>
          {lastResult ? (
            <div
              role="status"
              aria-live="polite"
              data-testid="dev-error-remote-status"
              className="mt-3 min-h-14 rounded-md border border-[#ff98a2]/30 bg-[#ff98a2]/10 px-3 py-2"
            >
              <p className="text-[11px] font-black text-white">
                {lastResult.title}
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-white/72">
                {lastResult.message}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
