import axios, { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import API from "./axios";

const originalAdapter = API.defaults.adapter;

describe("API token refresh", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    API.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("refreshes an expired access token and retries the original request", async () => {
    localStorage.setItem("accessToken", "expired-access");
    localStorage.setItem("refreshToken", "old-refresh");

    const observedAuthorization = [];
    API.defaults.adapter = vi.fn(async (config) => {
      const authorization = config.headers.get("Authorization");
      observedAuthorization.push(authorization);

      if (authorization === "Bearer fresh-access") {
        return {
          data: { success: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      const response = {
        data: { success: false },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      };
      throw new AxiosError(
        "Unauthorized",
        AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        response,
      );
    });

    const refreshRequest = vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        data: {
          accessToken: "fresh-access",
          refreshToken: "fresh-refresh",
        },
      },
    });

    const response = await API.get("/private-resource");

    expect(response.data.success).toBe(true);
    expect(refreshRequest).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      { refreshToken: "old-refresh" },
      expect.any(Object),
    );
    expect(observedAuthorization).toEqual([
      "Bearer expired-access",
      "Bearer fresh-access",
    ]);
    expect(localStorage.getItem("accessToken")).toBe("fresh-access");
    expect(localStorage.getItem("refreshToken")).toBe("fresh-refresh");
  });
});
