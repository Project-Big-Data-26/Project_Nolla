import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl } from "./baseUrl";

describe("normalizeApiBaseUrl", () => {
  it.each([
    [undefined, "http://localhost:5000/api"],
    ["", "http://localhost:5000/api"],
    ["localhost:5000", "http://localhost:5000/api"],
    ["http://localhost:5000", "http://localhost:5000/api"],
    ["http://localhost:5000/api", "http://localhost:5000/api"],
    ["https://api.nolla.id/api/", "https://api.nolla.id/api"],
    [" https://api.nolla.id ", "https://api.nolla.id/api"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeApiBaseUrl(input)).toBe(expected);
  });
});
