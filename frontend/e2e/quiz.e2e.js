import { test, expect } from '@playwright/test';
import {
  answerUntilInterim,
  expectNoHorizontalScroll,
  expectTouchTargets,
  isolateNetwork,
} from './helpers.js';

test.describe('Quiz', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await isolateNetwork(page, { allowVideo: testInfo.title.includes('vidéo') });
  });

  test('parcours complet : intro → 15 questions → proposition → résultats', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/quiz');
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: /Commencer l'analyse/i }).click();

    // Une question par écran, progression visible
    await expect(page.getByRole('progressbar', { name: 'Progression du quiz' })).toBeVisible();
    await expect(page.getByText('Question 1 sur 15')).toBeVisible();
    await expect(page.getByTestId('answer')).toHaveCount(4);
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);

    // Réponses en pleine largeur sur téléphone
    if (isMobile) {
      const viewport = page.viewportSize();
      const box = await page.getByTestId('answer').first().boundingBox();
      expect(box.width).toBeGreaterThan(viewport.width * 0.85);
      // Bandeau compact d'analyse (le panneau complet est dans un tiroir)
      await expect(page.getByRole('button', { name: 'Analyse', exact: true })).toBeVisible();
    }

    await answerUntilInterim(page);
    await expect(
      page.getByRole('heading', { name: /Voici ce que nous avons trouvé/ }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);

    await page.getByRole('button', { name: /Voir mon résultat final/i }).click();
    await expect(page).toHaveURL(/\/results$/);
    await expect(page.getByRole('heading', { name: 'Vos recommandations' })).toBeVisible();
    await expect(page.locator('[data-result-card]')).toHaveCount(3);
    await expectNoHorizontalScroll(page);
  });

  test('« Question précédente » revient à la question d’avant', async ({ page }) => {
    await page.goto('/quiz');
    await page.getByRole('button', { name: /Commencer l'analyse/i }).click();
    const back = page.getByRole('button', { name: /Question précédente/ });
    await expect(back).toBeHidden();

    await page.getByTestId('answer').nth(1).click();
    await expect(page.getByText('Question 2 sur 15')).toBeVisible();
    await page.getByTestId('answer').nth(2).click();
    await expect(page.getByText('Question 3 sur 15')).toBeVisible();

    await back.click();
    await expect(page.getByText('Question 2 sur 15')).toBeVisible();
    await back.click();
    await expect(page.getByText('Question 1 sur 15')).toBeVisible();
    await expect(back).toBeHidden();
  });

  test('tiroir d’analyse sur téléphone : ouverture et fermeture', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Tiroir réservé au téléphone');
    await page.goto('/quiz');
    await page.getByRole('button', { name: /Commencer l'analyse/i }).click();
    await page.getByTestId('answer').first().click();

    await page.getByRole('button', { name: 'Analyse', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Analyse en direct' });
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('la vidéo de fond n’est pas chargée sur téléphone', async ({ page, isMobile }) => {
    const videos = [];
    page.on('request', (r) => r.url().endsWith('.mp4') && videos.push(r.url()));
    await page.goto('/quiz');
    await page.getByRole('button', { name: /Commencer l'analyse/i }).click();
    await expect(page.getByTestId('answer').first()).toBeVisible();
    await page.waitForTimeout(500);
    expect(videos.length > 0).toBe(!isMobile);
  });
});
