import { logger } from "@/shared/lib/logger";

const originalNodeEnv = process.env.NODE_ENV;

// NODE_ENV는 @types/node에서 읽기 전용 타입이므로 넓힌 타입으로 할당한다.
const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

describe("logger", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    setNodeEnv(originalNodeEnv);
  });

  afterAll(() => {
    setNodeEnv(originalNodeEnv);
  });

  it("suppresses debug and info messages in production", () => {
    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    setNodeEnv("production");

    logger.debug("debug message");
    logger.info("info message");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("forwards warnings and errors", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    logger.warn("warning");
    logger.error("error");

    expect(warnSpy).toHaveBeenCalledWith("warning");
    expect(errorSpy).toHaveBeenCalledWith("error");
  });
});
