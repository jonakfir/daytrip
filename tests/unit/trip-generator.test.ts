import { describe, it, expect } from "vitest";
import { stripJsonFences } from "@/lib/trip-generator";

describe("stripJsonFences", () => {
  it("returns the text unchanged when there's no fence", () => {
    expect(stripJsonFences('{"a":1}')).toBe('{"a":1}');
    expect(stripJsonFences("  [1,2,3]  ")).toBe("[1,2,3]");
  });

  it("strips a closed ```json ... ``` fence", () => {
    const input = '```json\n{"a":1}\n```';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("strips a closed generic ``` fence", () => {
    expect(stripJsonFences('```\n[1,2]\n```')).toBe("[1,2]");
  });

  it("strips an OPEN fence from a truncated response", () => {
    // This is the prod failure case from 2026-04-16: Claude returned a
    // response that started with ```json\n but the closing fence was
    // cut off by max_tokens. stripJsonFences must still return the
    // usable JSON body (truncated though it may be) rather than the
    // raw backticks.
    const input = '```json\n[{"dayNumber":1,"date":"2026-05-01"}]';
    const out = stripJsonFences(input);
    expect(out.startsWith("[")).toBe(true);
    expect(out.includes("```")).toBe(false);
  });

  it("strips trailing stray backticks on open fences", () => {
    const input = '```json\n{"a":1}`';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("handles preamble before the fence", () => {
    const input = 'Here is the JSON:\n```json\n{"a":1}\n```';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });
});
