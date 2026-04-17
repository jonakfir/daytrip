import { describe, it, expect } from "vitest";
import { stripJsonFences, parseClaudeJson } from "@/lib/trip-generator";

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

describe("parseClaudeJson", () => {
  it("parses well-formed JSON like JSON.parse", () => {
    expect(parseClaudeJson('{"a":1,"b":[1,2]}')).toEqual({ a: 1, b: [1, 2] });
    expect(parseClaudeJson("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("parses JSON inside a fence", () => {
    expect(parseClaudeJson('```json\n{"x":true}\n```')).toEqual({ x: true });
  });

  it("repairs trailing commas (the real prod failure mode)", () => {
    // Prod on 2026-04-16 hit "Expected double-quoted property name" at
    // position 7421 — Claude emitted a trailing comma before the close
    // brace. jsonrepair fixes this.
    const input = '[{"a":1,},{"b":2,}]';
    expect(parseClaudeJson(input)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("repairs unquoted keys", () => {
    const input = '{a: 1, b: "two"}';
    expect(parseClaudeJson(input)).toEqual({ a: 1, b: "two" });
  });

  it("repairs single-quoted strings", () => {
    const input = "{'a': 'hello', 'b': 'world'}";
    expect(parseClaudeJson(input)).toEqual({ a: "hello", b: "world" });
  });

  it("repairs smart quotes", () => {
    // Curly/smart quotes from some Claude outputs
    const input = "{\u201Ca\u201D: \u201Cval\u201D}";
    expect(parseClaudeJson(input)).toEqual({ a: "val" });
  });

  it("repairs truncated JSON inside an open fence (the prod case)", () => {
    // This is the exact shape of what blew up the first prod trip.
    const input =
      '```json\n[{"dayNumber":1,"date":"2026-05-01","title":"Tokyo Day 1","morning":[{"name":"Tsukiji"}]}';
    const out = parseClaudeJson(input);
    expect(Array.isArray(out)).toBe(true);
    expect((out as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it("throws a helpful error when even repair fails", () => {
    // Empty string after fence-strip. jsonrepair maps "" → "" which is
    // still not valid JSON, so we get the thrown error.
    expect(() => parseClaudeJson("```json\n```")).toThrow(
      /Failed to parse Claude JSON/
    );
  });
});
