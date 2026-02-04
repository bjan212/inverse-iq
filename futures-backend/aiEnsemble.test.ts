import { describe, it, expect } from "vitest";
import { generateWithEnsemble } from "./aiEnsemble";

describe("AI Ensemble System", () => {
  it("should generate fields using built-in model when no external keys provided", async () => {
    const result = await generateWithEnsemble(
      "Write a marketing email for a SaaS product"
    );

    // Verify all required fields are present
    expect(result.fields).toHaveProperty("actor");
    expect(result.fields).toHaveProperty("mission");
    expect(result.fields).toHaveProperty("input");
    expect(result.fields).toHaveProperty("memory");
    expect(result.fields).toHaveProperty("assets");
    expect(result.fields).toHaveProperty("actions");
    expect(result.fields).toHaveProperty("original");
    expect(result.fields).toHaveProperty("concrete");
    expect(result.fields).toHaveProperty("evident");
    expect(result.fields).toHaveProperty("assertive");
    expect(result.fields).toHaveProperty("narrative");

    // Verify at least built-in was used
    expect(result.modelsUsed).toContain("built-in");
    expect(result.modelsUsed.length).toBeGreaterThanOrEqual(1);

    // Verify fields have content
    expect(result.fields.actor.length).toBeGreaterThan(20);
    expect(result.fields.mission.length).toBeGreaterThan(20);
  }, 45000); // 45 second timeout for ensemble processing

  it("should handle technical content generation", async () => {
    const result = await generateWithEnsemble(
      "Create API documentation for a REST endpoint"
    );

    expect(result.fields).toHaveProperty("actor");
    expect(result.fields).toHaveProperty("mission");
    
    const allContent = Object.values(result.fields).join(" ").toLowerCase();
    expect(allContent).toMatch(/api|endpoint|documentation|rest/);
  }, 45000);

  it("should return synthesis notes about models used", async () => {
    const result = await generateWithEnsemble(
      "Generate a product description"
    );

    expect(result.synthesisNotes).toBeDefined();
    expect(result.synthesisNotes).toContain("model");
    expect(result.modelsUsed.length).toBeGreaterThanOrEqual(1);
  }, 45000);
});
