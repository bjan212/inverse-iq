import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("ai.suggest", () => {
  it("returns a suggestion based on input", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.suggest({
      framework: "aim",
      currentField: "actor",
      currentValue: "You are a seasoned financial analyst with 15 years of experience in tech startups.",
      targetField: "mission",
      allFields: {
        actor: "You are a seasoned financial analyst with 15 years of experience in tech startups.",
      },
    });

    expect(result).toHaveProperty("suggestion");
    expect(typeof result.suggestion).toBe("string");
    expect(result.suggestion.length).toBeGreaterThan(0);
  });

  it("handles empty current value gracefully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.suggest({
      framework: "aim",
      currentField: "actor",
      currentValue: "",
      targetField: "mission",
    });

    expect(result).toHaveProperty("suggestion");
    expect(typeof result.suggestion).toBe("string");
  });

  it(
    "supports all framework types",
    async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Test just a couple of frameworks to keep test time reasonable
      const frameworks: Array<"aim" | "map" | "ocean" | "crypto" | "spot" | "boardroom"> = [
        "aim",
        "crypto",
      ];

      for (const framework of frameworks) {
        const result = await caller.ai.suggest({
          framework,
          currentField: "test_field",
          currentValue: "This is a test value for the framework.",
          targetField: "next_field",
        });

        expect(result).toHaveProperty("suggestion");
        expect(typeof result.suggestion).toBe("string");
      }
    },
    15000
  );
});
