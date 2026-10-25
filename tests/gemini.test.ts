import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { MODELS, generateJSON, RateLimitError, GeminiTimeoutError } from "@/lib/gemini";

// Mock @google/generative-ai
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mockGetGenerativeModel;
    },
  };
});

describe("Gemini API Client & Fallback Mechanism", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have currently active models configured in exact fallback priority", () => {
    expect(MODELS).toEqual(["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"]);
  });

  it("should succeed on the first model without fallback when it responds with valid JSON", async () => {
    const testSchema = z.object({ success: z.boolean(), message: z.string() });
    const expectedOutput = { success: true, message: "Hello from gemini-flash-latest" };

    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(expectedOutput),
        },
      }),
    });

    const result = await generateJSON("test prompt", testSchema);

    expect(result).toEqual(expectedOutput);
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-flash-latest" }),
    );
  });

  it("should log console.warn and fallback to next model when the first model fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const testSchema = z.object({ plan: z.string() });
    const expectedOutput = { plan: "Generated via gemini-2.0-flash" };

    // First model fails (e.g. 404 Deprecated/Not Found)
    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi
        .fn()
        .mockRejectedValueOnce(
          new Error(
            "[404 Not Found] models/gemini-flash-latest is not found for API version v1beta",
          ),
        ),
    }));

    // Second model succeeds
    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi.fn().mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(expectedOutput),
        },
      }),
    }));

    const result = await generateJSON("test prompt", testSchema);

    expect(result).toEqual(expectedOutput);
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: "gemini-flash-latest" }),
    );
    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: "gemini-2.0-flash" }),
    );

    // Verify fallback logging
    expect(warnSpy).toHaveBeenCalledWith(
      "[Gemini] Model 'gemini-flash-latest' failed, trying next fallback model:",
      "[404 Not Found] models/gemini-flash-latest is not found for API version v1beta",
    );

    warnSpy.mockRestore();
  });

  it("should cascade through all models if earlier ones fail and succeed on third model", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const testSchema = z.object({ value: z.number() });
    const expectedOutput = { value: 42 };

    // Model 1 fails
    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi.fn().mockRejectedValueOnce(new Error("Model 1 unavailable")),
    }));
    // Model 2 fails
    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi.fn().mockRejectedValueOnce(new Error("Model 2 internal server error")),
    }));
    // Model 3 succeeds
    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi.fn().mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(expectedOutput),
        },
      }),
    }));

    const result = await generateJSON("test prompt", testSchema);

    expect(result).toEqual(expectedOutput);
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(3);
    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: "gemini-flash-latest" }),
    );
    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: "gemini-2.0-flash" }),
    );
    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ model: "gemini-2.5-flash" }),
    );

    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it("should throw RateLimitError immediately without fallback when quota (429) is hit", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const testSchema = z.object({ value: z.number() });

    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi
        .fn()
        .mockRejectedValueOnce(new Error("Resource has been exhausted (e.g. check quota). [429]")),
    }));

    await expect(generateJSON("test prompt", testSchema)).rejects.toThrow(RateLimitError);

    // Should NOT have attempted fallback models because quota affects the entire API key
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("should throw GeminiTimeoutError when AbortController signal aborts", async () => {
    const testSchema = z.object({ value: z.number() });

    mockGetGenerativeModel.mockImplementationOnce(() => ({
      generateContent: vi.fn().mockImplementation(() => {
        const error = new Error("This operation was aborted");
        error.name = "AbortError";
        return Promise.reject(error);
      }),
    }));

    await expect(generateJSON("test prompt", testSchema)).rejects.toThrow(GeminiTimeoutError);
  });
});
