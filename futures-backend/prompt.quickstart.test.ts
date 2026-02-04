import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

describe("Quick Start Prompt Generation", () => {
  const createMockContext = (): TrpcContext => ({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  it("should generate all 11 framework fields from a simple description", async () => {
    const caller = appRouter.createCaller(createMockContext());

    const result = await caller.prompt.generateFromDescription({
      description: "Write a technical blog post about React Server Components",
    });

    // Verify all required fields are present
    expect(result).toHaveProperty("actor");
    expect(result).toHaveProperty("input");
    expect(result).toHaveProperty("mission");
    expect(result).toHaveProperty("memory");
    expect(result).toHaveProperty("assets");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("original");
    expect(result).toHaveProperty("concrete");
    expect(result).toHaveProperty("evident");
    expect(result).toHaveProperty("assertive");
    expect(result).toHaveProperty("narrative");

    // Verify fields are not empty
    expect(result.actor.length).toBeGreaterThan(10);
    expect(result.mission.length).toBeGreaterThan(10);
    expect(result.input.length).toBeGreaterThan(10);

    // Verify fields are relevant to the description
    const allContent = Object.values(result).join(" ").toLowerCase();
    expect(allContent).toContain("react");
  }, 30000); // 30 second timeout for AI generation

  it("should handle crypto trading description", async () => {
    const caller = appRouter.createCaller(createMockContext());

    const result = await caller.prompt.generateFromDescription({
      description: "Analyze Bitcoin price trends for futures trading",
    });

    expect(result).toHaveProperty("actor");
    expect(result).toHaveProperty("mission");
    
    const allContent = Object.values(result).join(" ").toLowerCase();
    expect(allContent).toMatch(/bitcoin|btc|crypto/);
  }, 30000);

  it("should generate detailed content for each field", async () => {
    const caller = appRouter.createCaller(createMockContext());

    const result = await caller.prompt.generateFromDescription({
      description: "Create a marketing strategy for a SaaS product",
    });

    // Each field should have substantial content (at least 20 characters)
    Object.entries(result).forEach(([key, value]) => {
      expect(value.length).toBeGreaterThan(20);
    });
  }, 30000);
});
