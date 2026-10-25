import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { generateJSON, cleanJsonResponse } from "@/lib/gemini";

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

describe("Gemini API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cleanJsonResponse", () => {
    it("should strip ```json fences from response", () => {
      const raw = '```json\n{"key": "value"}\n```';
      expect(cleanJsonResponse(raw)).toBe('{"key": "value"}');
    });

    it("should strip plain ``` fences from response", () => {
      const raw = '```\n{"key": "value"}\n```';
      expect(cleanJsonResponse(raw)).toBe('{"key": "value"}');
    });

    it("should return already-clean JSON unchanged", () => {
      const raw = '{"key": "value"}';
      expect(cleanJsonResponse(raw)).toBe('{"key": "value"}');
    });
  });

  describe("generateJSON", () => {
    it("should call gemini-flash-lite-latest and return validated JSON", async () => {
      const testSchema = z.object({ success: z.boolean(), message: z.string() });
      const expectedOutput = { success: true, message: "Hello from Gemini" };

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
        expect.objectContaining({ model: "gemini-flash-lite-latest" }),
      );
    });

    it("should throw Error when Gemini returns empty response", async () => {
      const testSchema = z.object({ value: z.number() });

      mockGetGenerativeModel.mockReturnValue({
        generateContent: mockGenerateContent.mockResolvedValueOnce({
          response: {
            text: () => "",
          },
        }),
      });

      await expect(generateJSON("test prompt", testSchema)).rejects.toThrow(
        "Gemini returned an empty response",
      );
    });

    it("should throw Error when Gemini API call fails", async () => {
      const testSchema = z.object({ value: z.number() });

      mockGetGenerativeModel.mockReturnValue({
        generateContent: mockGenerateContent.mockRejectedValueOnce(new Error("API request failed")),
      });

      await expect(generateJSON("test prompt", testSchema)).rejects.toThrow("API request failed");
    });

    it("should throw when response fails Zod validation", async () => {
      const testSchema = z.object({ requiredField: z.string() });

      mockGetGenerativeModel.mockReturnValue({
        generateContent: mockGenerateContent.mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({ wrongField: 123 }),
          },
        }),
      });

      await expect(generateJSON("test prompt", testSchema)).rejects.toThrow();
    });

    it("should throw when response contains invalid JSON", async () => {
      const testSchema = z.object({ value: z.number() });

      mockGetGenerativeModel.mockReturnValue({
        generateContent: mockGenerateContent.mockResolvedValueOnce({
          response: {
            text: () => "this is not json at all",
          },
        }),
      });

      await expect(generateJSON("test prompt", testSchema)).rejects.toThrow();
    });
  });
});
