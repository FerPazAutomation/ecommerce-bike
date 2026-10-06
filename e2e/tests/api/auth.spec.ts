import { test, expect } from "@playwright/test";
import { uniqueRegisterUser, users } from "../../data/users";

test.describe("Auth API", () => {
  test("POST /auth/login with demo user returns access_token", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: users.demo.email,
        password: users.demo.password,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      access_token: expect.any(String),
      token_type: "bearer",
    });
    expect(body.access_token.length).toBeGreaterThan(10);
  });

  test("POST /auth/login with wrong password returns 401", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: users.invalid.email,
        password: users.invalid.password,
      },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /auth/login with unknown email returns 401", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: users.unknown.email,
        password: users.unknown.password,
      },
    });
    expect(response.status()).toBe(401);
    expect(await response.text()).toContain("Incorrect email or password");
  });

  test("POST /auth/register creates user then login works", async ({
    request,
  }) => {
    const newUser = uniqueRegisterUser();

    const register = await request.post("/auth/register", {
      data: newUser,
    });
    expect(register.status()).toBe(200);

    const login = await request.post("/auth/login", {
      data: {
        email: newUser.email,
        password: newUser.password,
      },
    });
    expect(login.status()).toBe(200);
    const body = await login.json();
    expect(body.access_token).toBeTruthy();
  });
});
