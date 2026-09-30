import { describe, expect, it } from "vitest";
import {
  EMAIL_INVALID_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
  validateEmail,
  validateNewPassword,
  validateRequiredPassword,
} from "./validation";

describe("validateEmail", () => {
  it("acepta un email con formato válido", () => {
    expect(validateEmail("demo@example.com")).toBeUndefined();
    expect(validateEmail("  demo@example.com  ")).toBeUndefined();
  });

  it("rechaza vacío o sin formato de email", () => {
    expect(validateEmail("")).toBe(EMAIL_INVALID_MESSAGE);
    expect(validateEmail("demo")).toBe(EMAIL_INVALID_MESSAGE);
    expect(validateEmail("demo@example")).toBe(EMAIL_INVALID_MESSAGE);
    expect(validateEmail("de mo@example.com")).toBe(EMAIL_INVALID_MESSAGE);
  });
});

describe("validateNewPassword", () => {
  it("exige más de 8 caracteres, igual que la API", () => {
    expect(validateNewPassword("12345678")).toBe(PASSWORD_TOO_SHORT_MESSAGE);
    expect(validateNewPassword("123456789")).toBeUndefined();
  });
});

describe("validateRequiredPassword", () => {
  it("solo exige que no esté vacía", () => {
    expect(validateRequiredPassword("")).toBe(PASSWORD_REQUIRED_MESSAGE);
    expect(validateRequiredPassword("x")).toBeUndefined();
  });
});
