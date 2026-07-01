type LogMethod = (...data: unknown[]) => void;

const isProduction = () => process.env["NODE_ENV"] === "production";

const callWhenEnabled = (method: LogMethod, enabled: boolean, data: unknown[]) => {
  if (enabled) {
    method(...data);
  }
};

export const logger = {
  debug: (...data: unknown[]) => {
    callWhenEnabled(console.debug, !isProduction(), data);
  },
  info: (...data: unknown[]) => {
    callWhenEnabled(console.info, !isProduction(), data);
  },
  warn: (...data: unknown[]) => {
    console.warn(...data);
  },
  error: (...data: unknown[]) => {
    console.error(...data);
  },
};
