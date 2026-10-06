import { describe, expect, it } from "vitest";
import {
  EMAIL_INVALID_MESSAGE,
  EMAIL_REQUIRED_MESSAGE,
  EMAIL_TOO_LONG_MESSAGE,
  FULL_NAME_TOO_LONG_MESSAGE,
  PASSWORD_CONFIRM_REQUIRED_MESSAGE,
  PASSWORD_EDGE_SPACES_MESSAGE,
  PASSWORD_MISMATCH_MESSAGE,
  PASSWORD_NEEDS_DIGIT_MESSAGE,
  PASSWORD_NEEDS_LETTER_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_SAME_AS_CURRENT_MESSAGE,
  PASSWORD_TOO_LONG_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
  passwordRequirements,
  validateDifferentPassword,
  validateEmail,
  validateNewPassword,
  validateOptionalFullName,
  validatePasswordConfirmation,
  validateRequiredPassword,
} from "./validation";

describe("validateEmail", () => {
  it("acepta un email con formato válido (con espacios alrededor)", () => {
    expect(validateEmail("demo@example.com")).toBeUndefined();
    expect(validateEmail("  demo@example.com  ")).toBeUndefined();
  });

  it("distingue vacío de formato inválido", () => {
    expect(validateEmail("")).toBe(EMAIL_REQUIRED_MESSAGE);
    expect(validateEmail("   ")).toBe(EMAIL_REQUIRED_MESSAGE);
    expect(validateEmail("demo")).toBe(EMAIL_INVALID_MESSAGE);
    expect(validateEmail("demo@example")).toBe(EMAIL_INVALID_MESSAGE);
    expect(validateEmail("de mo@example.com")).toBe(EMAIL_INVALID_MESSAGE);
  });

  it("rechaza emails de más de 254 caracteres", () => {
    expect(validateEmail(`${"a".repeat(250)}@example.com`)).toBe(EMAIL_TOO_LONG_MESSAGE);
  });
});

describe("validateNewPassword (espejo de check_password_policy del backend)", () => {
  it.each([
    ["", PASSWORD_REQUIRED_MESSAGE],
    ["abcd1234", PASSWORD_TOO_SHORT_MESSAGE],
    ["a1".repeat(37), PASSWORD_TOO_LONG_MESSAGE],
    ["123456789", PASSWORD_NEEDS_LETTER_MESSAGE],
    ["abcdefghi", PASSWORD_NEEDS_DIGIT_MESSAGE],
    [" abcd12345", PASSWORD_EDGE_SPACES_MESSAGE],
    ["abcd12345 ", PASSWORD_EDGE_SPACES_MESSAGE],
  ])("rechaza %j", (password, message) => {
    expect(validateNewPassword(password)).toBe(message);
  });

  it.each(["abcde1234", "TestPass1234", "clave con espacio 9", "a1".repeat(36)])("acepta %j", (password) => {
    expect(validateNewPassword(password)).toBeUndefined();
  });

  it("mide el máximo en bytes y el mínimo en caracteres, igual que Python", () => {
    expect(validateNewPassword(`${"ñ".repeat(36)}1`)).toBe(PASSWORD_TOO_LONG_MESSAGE);
    expect(validateNewPassword("abcdefg😀")).toBe(PASSWORD_TOO_SHORT_MESSAGE);
  });
});

describe("passwordRequirements", () => {
  it("marca cada requisito a medida que se cumple", () => {
    const met = (value: string) => passwordRequirements(value).map((r) => r.met);
    expect(met("")).toEqual([false, false, false]);
    expect(met("abc")).toEqual([false, true, false]);
    expect(met("abcdefgh1")).toEqual([true, true, true]);
  });
});

describe("confirmación y cambio de contraseña", () => {
  it("exige repetir la contraseña y que coincida", () => {
    expect(validatePasswordConfirmation("abcde1234", "")).toBe(PASSWORD_CONFIRM_REQUIRED_MESSAGE);
    expect(validatePasswordConfirmation("abcde1234", "abcde1235")).toBe(PASSWORD_MISMATCH_MESSAGE);
    expect(validatePasswordConfirmation("abcde1234", "abcde1234")).toBeUndefined();
  });

  it("la nueva contraseña debe ser distinta de la actual", () => {
    expect(validateDifferentPassword("abcde1234", "abcde1234")).toBe(PASSWORD_SAME_AS_CURRENT_MESSAGE);
    expect(validateDifferentPassword("abcde1234", "otra12345")).toBeUndefined();
  });
});

describe("otros campos", () => {
  it("login solo exige contraseña no vacía", () => {
    expect(validateRequiredPassword("")).toBe(PASSWORD_REQUIRED_MESSAGE);
    expect(validateRequiredPassword("demo1234")).toBeUndefined();
  });

  it("nombre opcional con máximo de 100 caracteres", () => {
    expect(validateOptionalFullName("")).toBeUndefined();
    expect(validateOptionalFullName(`  ${"x".repeat(100)}  `)).toBeUndefined();
    expect(validateOptionalFullName("x".repeat(101))).toBe(FULL_NAME_TOO_LONG_MESSAGE);
  });
});
