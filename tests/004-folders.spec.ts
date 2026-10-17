import { expect, test } from "@playwright/test";

test("cria e compartilha uma pasta protegida por PIN", async ({ page, browser }) => {
  const folderName = `Cliente ${Date.now()}`;
  await page.goto("http://localhost:3000/videos");

  await page.getByRole("button", { name: "Nova pasta" }).click();
  await page.getByLabel("Nome da pasta").fill(folderName);
  await page.getByRole("button", { name: "Criar pasta" }).click();
  await page.getByRole("link", { name: new RegExp(folderName) }).click();

  await expect(page.getByRole("heading", { name: folderName })).toBeVisible();
  await page.getByRole("button", { name: "Compartilhar" }).click();
  await page.getByRole("switch", { name: "Ativar compartilhamento da pasta" }).click();
  await page.getByLabel("PIN da pasta").fill("2468");
  await page.getByRole("button", { name: "Ativar PIN" }).click();
  await expect(page.getByText("PIN ativado")).toBeVisible();
  const folderUrl = page.url();
  await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).click();

  await page.goto("http://localhost:3000/videos");
  await page.getByRole("button", { name: /Nova demonstração/ }).click();
  await page.getByRole("menuitem", { name: "Enviar um vídeo" }).click();
  await page.locator('input[type="file"]').setInputFiles("tests/assets/example_video.webm");
  await page.getByRole("button", { name: "Enviar vídeo" }).click();
  await expect(page).toHaveURL(/\/share\/[A-Za-z0-9]+/, { timeout: 30000 });
  await page.getByRole("button", { name: "Mais opções" }).click();
  await page.getByRole("button", { name: "Mover para pasta" }).click();
  await page.getByLabel("Pasta").selectOption({ label: folderName });
  await page.getByRole("button", { name: "Mover", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver pasta" })).toBeVisible();

  const visitor = await browser.newContext();
  const visitorPage = await visitor.newPage();
  await visitorPage.goto(folderUrl);
  await expect(visitorPage.getByText("Conteúdo protegido")).toBeVisible();
  await visitorPage.getByLabel("PIN de acesso").fill("2468");
  await visitorPage.getByRole("button", { name: "Acessar" }).click();
  await expect(visitorPage.getByRole("heading", { name: folderName })).toBeVisible();
  await visitorPage.getByRole("link", { name: "Assistir: example_video.webm" }).click();
  await expect(visitorPage.locator("video")).toBeVisible();
  await expect(visitorPage.getByRole("link", { name: "Ver pasta" })).toBeVisible();
  await visitor.close();
});
