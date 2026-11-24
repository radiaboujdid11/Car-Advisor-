import { test, expect } from '@playwright/test';
import { expectNoHorizontalScroll, expectTouchTargets, isolateNetwork } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await isolateNetwork(page);
});

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440];
const PAGES = ['/', '/quiz', '/cars', '/cars/319', '/compare'];

test.describe('Aucun défilement horizontal', () => {
  // Une seule configuration suffit : on fait varier la largeur nous-mêmes.
  test.skip(({ isMobile }) => !isMobile, 'Exécuté une fois (projet mobile)');

  for (const width of WIDTHS) {
    test(`${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path, { waitUntil: 'load' });
        await page.waitForTimeout(300);
        await expectNoHorizontalScroll(page);
      }
    });
  }
});

test.describe('Navigation', () => {
  test('barre d’onglets en bas sur téléphone, menu dans l’en-tête sur ordinateur', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/cars');
    const tabBar = page.locator('nav.fixed[aria-label="Navigation principale"]');
    const headerNav = page.locator('header nav[aria-label="Navigation principale"]');
    if (isMobile) {
      await expect(tabBar).toBeVisible();
      await expect(headerNav).toBeHidden();
      await tabBar.getByRole('link', { name: /Comparer/ }).click();
      await expect(page).toHaveURL(/\/compare$/);
    } else {
      await expect(tabBar).toBeHidden();
      await expect(headerNav).toBeVisible();
    }
    await expectTouchTargets(page);
  });
});

test.describe('Catalogue', () => {
  test('chargement progressif et champs de 16 px', async ({ page }) => {
    await page.goto('/cars');
    const cards = page.locator('h3');
    await expect(cards).toHaveCount(24);
    await page.getByRole('button', { name: /Voir plus/ }).click();
    await expect(cards).toHaveCount(48);

    const fontSizes = await page
      .locator('input, select')
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    for (const size of fontSizes) expect(size).toBeGreaterThanOrEqual(16);

    await page.getByLabel('Marque').selectOption('Dacia');
    await expect(page.getByText(/^\d+ voitures?$/)).toBeVisible();
    await expectTouchTargets(page);
  });
});

test.describe('Comparateur', () => {
  test('tableau défilant avec colonne des critères visible', async ({ page }) => {
    await page.goto('/cars');
    const compare = page.getByRole('button', { name: /^Comparer / });
    for (const i of [0, 1, 2]) await compare.nth(i).click();
    await page.goto('/compare');
    await expect(page.getByRole('region', { name: 'Tableau comparatif' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Retirer / })).toHaveCount(3);
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);
  });
});

test.describe('Fiche voiture', () => {
  test('la provenance du prix est indiquée', async ({ page }) => {
    await page.goto('/cars/319');
    // Sans vérification enregistrée : mention « indicatif » ; sinon date et source.
    await expect(
      page.getByText(/Prix indicatif, à confirmer en concession|Prix vérifié le/),
    ).toBeVisible();
  });

  test('un modèle ajouté depuis la presse cite la date et le journal', async ({ page }) => {
    await page.goto('/cars/416'); // Renault Austral (sources/ajouts-presse.json)
    const line = page.getByTestId('price-launch');
    await expect(line).toContainText('Prix de lancement annoncé le 14 octobre 2025');
    await expect(line.getByRole('link', { name: 'Le Matin' })).toHaveAttribute(
      'href',
      /lematin\.ma/,
    );
  });
});
