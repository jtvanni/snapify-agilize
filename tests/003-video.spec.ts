import { expect, test } from "@playwright/test";

test.describe.serial("visualização da demonstração", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/videos");
    await page.getByRole("link", { name: /Abrir demonstração:/ }).first().click();
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/share\/[A-Za-z0-9]+/);
  });

  test("reproduz o vídeo e mantém o player dentro do limite de largura", async ({ page }) => {
    const video = page.locator("video").first();
    await expect(video).toBeVisible();

    await page.getByRole("button", { name: "Reproduzir" }).click();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused)).toBe(true);
    await video.click();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);

    await page.setViewportSize({ width: 1440, height: 900 });
    const player = page.getByTestId("video-player");
    const desktopBox = await player.boundingBox();
    expect(desktopBox?.width).toBeLessThanOrEqual(1120);

    await page.setViewportSize({ width: 375, height: 812 });
    const mobileBox = await player.boundingBox();
    expect(mobileBox?.width).toBeLessThanOrEqual(343);

    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletBox = await player.boundingBox();
    expect(tabletBox?.width).toBeLessThanOrEqual(704);
  });

  test("renomeia a demonstração", async ({ page }) => {
    const nextTitle = `Demonstração ${Date.now()}`;

    await page.getByRole("button", { name: "Mais opções" }).click();
    await page.getByRole("menuitem", { name: "Renomear" }).click();
    await page.getByLabel("Título").fill(nextTitle);
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("heading", { name: nextTitle })).toBeVisible();
  });

  test("configura o compartilhamento e a expiração", async ({ page }) => {
    await page.getByRole("button", { name: "Compartilhar" }).click();
    const sharingSwitch = page.getByRole("switch", { name: "Ativar link público" });
    if ((await sharingSwitch.getAttribute("aria-checked")) !== "true") await sharingSwitch.click();

    await expect(page.getByRole("button", { name: "Copiar link público" })).toBeVisible();
    await page.getByRole("button", { name: "Nunca" }).click();
    await page.getByRole("option", { name: "Em 24 horas" }).click();
  });

  test("exclui a demonstração", async ({ page }) => {
    await page.getByRole("button", { name: "Mais opções" }).click();
    await page.getByRole("menuitem", { name: "Excluir" }).click();
    await expect(page).toHaveURL("http://localhost:3000/videos");
  });
});
