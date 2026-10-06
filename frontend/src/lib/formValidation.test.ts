import { describe, expect, it } from "vitest";
import { type Rules, firstInvalidField, validateField, validateForm } from "./formValidation";

type Signup = { email: string; password: string; confirm: string };

const rules: Rules<Signup> = {
  email: [(v) => (v ? undefined : "requerido"), (v) => (v.includes("@") ? undefined : "formato")],
  password: [(v) => (v.length > 3 ? undefined : "corta")],
  confirm: [(v, values) => (v === values.password ? undefined : "no coincide")],
};

describe("validateField", () => {
  it("devuelve el primer mensaje que falla", () => {
    expect(validateField("email", { email: "", password: "", confirm: "" }, rules)).toBe("requerido");
    expect(validateField("email", { email: "x", password: "", confirm: "" }, rules)).toBe("formato");
  });

  it("permite reglas cruzadas entre campos", () => {
    expect(validateField("confirm", { email: "", password: "abcd", confirm: "abce" }, rules)).toBe("no coincide");
  });
});

describe("validateForm", () => {
  it("junta solo los campos con error", () => {
    expect(validateForm({ email: "a@b.c", password: "ab", confirm: "ab" }, rules)).toEqual({ password: "corta" });
    expect(validateForm({ email: "a@b.c", password: "abcd", confirm: "abcd" }, rules)).toEqual({});
  });
});

describe("firstInvalidField", () => {
  it("respeta el orden visual del formulario", () => {
    const order: (keyof Signup)[] = ["email", "password", "confirm"];
    expect(firstInvalidField({ confirm: "x", password: "y" }, order)).toBe("password");
    expect(firstInvalidField({}, order)).toBeUndefined();
  });
});
