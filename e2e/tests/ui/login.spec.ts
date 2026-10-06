import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/loginPage";
import { users } from "../../data/users";

test.describe("Login UI", () => {
  let loginPage: LoginPage;

  // Corre antes de cada test: crea el Page Object y abre /login.
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goTo();
  });

  // Los tests van dentro del describe, no dentro del beforeEach.
  test("login with valid credentials redirects to products", async ({ page }) => {
    await loginPage.login(users.demo.email, users.demo.password);

    await expect(page).toHaveURL(/\/productos/);
    await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  });

  test("login with wrong password shows an error", async ({ page }) => {
    await loginPage.login(users.invalid.email, users.invalid.password);

    // Mensaje de la API (401), mostrado en la caja de error del formulario.
    await expect(page.getByRole("alert")).toHaveText("Incorrect email or password");
    await expect(page).toHaveURL(/\/login/);
  });
});
