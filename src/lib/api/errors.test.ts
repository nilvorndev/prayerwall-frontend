import { describe, it, expect } from "vitest";
import { ApiError, normalizeApiError } from "./errors";

describe("ApiError", () => {
  it("creates an error with status and normalized detail", () => {
    const error = new ApiError(404, { detail: "Not found" }, "The resource was not found");
    expect(error.status).toBe(404);
    expect(error.detail).toBe("Not found");
    expect(error.message).toBe("Not found");
  });

  it("uses fallback when detail is missing", () => {
    const error = new ApiError(500, null, "Server error");
    expect(error.detail).toBe("Server error");
    expect(error.message).toBe("Server error");
  });

  it("extracts fields from raw error", () => {
    const error = new ApiError(
      400,
      { fields: { email: ["Email is required"] }, detail: "Validation error" },
      "Fallback",
    );
    expect(error.detail).toBe("Validation error");
    expect(error.fields.email).toEqual(["Email is required"]);
  });
});

describe("normalizeApiError", () => {
  it("handles string raw input", () => {
    const result = normalizeApiError("Something went wrong", "Fallback");
    expect(result.detail).toBe("Something went wrong");
  });

  it("handles object with detail field", () => {
    const result = normalizeApiError({ detail: "Validation error" }, "Fallback");
    expect(result.detail).toBe("Validation error");
  });

  it("uses fallback when raw is null", () => {
    const result = normalizeApiError(null, "Fallback message");
    expect(result.detail).toBe("Fallback message");
  });

  it("uses fallback when raw is undefined", () => {
    const result = normalizeApiError(undefined, "Fallback message");
    expect(result.detail).toBe("Fallback message");
  });

  it("extracts field errors from fields property", () => {
    const result = normalizeApiError(
      { fields: { email: ["Email is required"], password: ["Too short"] }, detail: "Check fields" },
      "Fallback",
    );
    expect(result.detail).toBe("Check fields");
    expect(result.fields.email).toEqual(["Email is required"]);
    expect(result.fields.password).toEqual(["Too short"]);
  });

  it("extracts field errors from fieldErrors property", () => {
    const result = normalizeApiError(
      { fieldErrors: { name: ["Name is required"] }, detail: "Check fields" },
      "Fallback",
    );
    expect(result.fields.name).toEqual(["Name is required"]);
  });

  it("extracts non_field_errors as detail", () => {
    const result = normalizeApiError({ non_field_errors: "Login failed" }, "Fallback");
    expect(result.detail).toBe("Login failed");
  });

  it("extracts code field", () => {
    const result = normalizeApiError({ code: "invalid_input", detail: "Bad request" }, "Fallback");
    expect(result.code).toBe("invalid_input");
    expect(result.detail).toBe("Bad request");
  });
});
