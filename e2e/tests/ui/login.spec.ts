import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/loginPage";
import { users } from "../../data/users";

test("Login with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goTo();
    await loginPage.login(users.demo.email, users.demo.password);
    await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
});

test("Login with invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goTo();
    await loginPage.login(users.invalid.email, users.invalid.password);
    await expect(page.getByText("Incorrect email or password")).toBeVisible();
});