import { expect, test } from "@playwright/test";

test.describe.serial("biblioteca de demonstrações", () => {
  test("exibe a biblioteca em português e abre as ações de criação", async ({ page }) => {
    await page.goto("http://localhost:3000/videos");

    await expect(page.getByRole("heading", { name: "Biblioteca de demonstrações" })).toBeVisible();
    await expect(page.getByText(/Snapify/i)).toHaveCount(0);

    await page.getByRole("button", { name: /Nova demonstração/ }).click();
    await expect(page.getByRole("menuitem", { name: "Gravar a tela" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Enviar um vídeo" })).toBeVisible();
  });

  test("oferece três perfis e seleciona a qualidade equilibrada por padrão", async ({ page }) => {
    await page.goto("http://localhost:3000/videos");
    await page.getByRole("button", { name: /Nova demonstração/ }).click();
    await page.getByRole("menuitem", { name: "Gravar a tela" }).click();

    await expect(page.getByRole("button", { name: /Econômica/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    await expect(page.getByRole("button", { name: /Equilibrada/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByRole("button", { name: /Alta/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await page.getByRole("button", { name: /Econômica/ }).click();
    await expect(page.getByRole("button", { name: /Econômica/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("envia um vídeo para a biblioteca", async ({ page }) => {
    await page.goto("http://localhost:3000/videos");
    await page.getByRole("button", { name: /Nova demonstração/ }).click();
    await page.getByRole("menuitem", { name: "Enviar um vídeo" }).click();

    await page.locator('input[type="file"]').setInputFiles("tests/assets/example_video.webm");
    await expect(page.getByText("example_video.webm")).toBeVisible();
    await page.getByRole("button", { name: "Enviar vídeo" }).click();

    await expect(page).toHaveURL(/http:\/\/localhost:3000\/share\/[A-Za-z0-9]+/, {
      timeout: 30000,
    });

    await page.getByRole("link", { name: "Demonstrações — Agilize IA" }).click();
    await expect(page.getByRole("link", { name: "Abrir demonstração: example_video.webm" })).toBeVisible();
  });
});
