import { expect, test } from "@playwright/test";

test("a tela de entrada usa a marca e o idioma da Agilize", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/sign-in");

  await expect(page).toHaveTitle(/Entrar \| Demonstrações — Agilize IA/);
  await expect(page.getByRole("heading", { name: "Entre para acessar as demonstrações" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Logo da Agilize IA" })).toBeVisible();
  await expect(page.getByText(/Snapify/i)).toHaveCount(0);

  await context.close();
});
