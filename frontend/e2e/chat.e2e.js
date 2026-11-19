// Assistant : interface testée avec une API simulée (aucun appel à Claude, aucun coût).
import { test, expect } from '@playwright/test';
import { expectNoHorizontalScroll, expectTouchTargets, isolateNetwork } from './helpers.js';

const sse = (events) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');

test.beforeEach(async ({ page }) => {
  await isolateNetwork(page);
});

test('conversation : suggestion, réponse diffusée, lien vers une fiche', async ({
  page,
  isMobile,
}) => {
  let requestBody;
  await page.route('**/api/chat', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: sse([
        { type: 'turn' },
        { type: 'status', text: 'Recherche dans le catalogue…' },
        { type: 'turn' },
        { type: 'text', text: 'Je vous propose la ' },
        { type: 'text', text: '[Alfa Romeo Giulia](/cars/319), **280 ch**.' },
        { type: 'done' },
      ]),
    });
  });

  await page.goto('/cars');
  await page.getByRole('button', { name: "Ouvrir l'assistant AutoAssist" }).click();
  const panel = page.getByRole('dialog', { name: 'Assistant AutoAssist' });
  await expect(panel).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectTouchTargets(page);

  await panel.getByRole('button', { name: /SUV familial/ }).click();
  const answer = panel.getByTestId('chat-assistant').last();
  await expect(answer).toContainText('Je vous propose la Alfa Romeo Giulia, 280 ch.');
  await expect(answer.locator('strong')).toHaveText('280 ch');
  expect(requestBody.messages.at(-1)).toEqual({
    role: 'user',
    content: 'Un SUV familial à moins de 300 000 DH ?',
  });

  // Les champs de saisie font 16 px (pas de zoom sur iPhone)
  const fontSize = await panel
    .getByLabel('Votre message')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);

  await answer.getByRole('link', { name: 'Alfa Romeo Giulia' }).click();
  await expect(page).toHaveURL(/\/cars\/319$/);
  if (isMobile) await expect(panel).toBeHidden(); // le panneau se ferme pour laisser voir la fiche
});

test('la conversation et les résultats du quiz sont envoyés à l’API', async ({ page }) => {
  const bodies = [];
  await page.route('**/api/chat', async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: sse([{ type: 'text', text: `Réponse ${bodies.length}` }, { type: 'done' }]),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      'carAdvisor_results',
      JSON.stringify({ top3: [{ id: 319, matchScore: 91, make: 'Alfa Romeo' }] }),
    );
  });

  await page.goto('/cars');
  await page.getByRole('button', { name: "Ouvrir l'assistant AutoAssist" }).click();
  const input = page.getByLabel('Votre message');
  await input.fill('Bonjour');
  await input.press('Enter');
  await expect(page.getByText('Réponse 1')).toBeVisible();
  await input.fill('Et ensuite ?');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText('Réponse 2')).toBeVisible();

  expect(bodies[1].messages).toEqual([
    { role: 'user', content: 'Bonjour' },
    { role: 'assistant', content: 'Réponse 1' },
    { role: 'user', content: 'Et ensuite ?' },
  ]);
  expect(bodies[0].quiz).toEqual([{ id: 319, matchScore: 91 }]);
});

test('assistant non configuré (503) : message clair', async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"assistant_non_configure"}',
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: "Ouvrir l'assistant AutoAssist" }).click();
  await page.getByLabel('Votre message').fill('Bonjour');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText(/assistant IA est en cours d'activation/)).toBeVisible();
});

test('le bouton est absent du quiz et ne masque pas la barre d’onglets', async ({
  page,
  isMobile,
}) => {
  await page.goto('/quiz');
  await expect(page.getByRole('button', { name: "Ouvrir l'assistant AutoAssist" })).toHaveCount(0);

  await page.goto('/cars');
  const launcher = page.getByRole('button', { name: "Ouvrir l'assistant AutoAssist" });
  await expect(launcher).toBeVisible();
  if (isMobile) {
    const tabBar = page.locator('nav.fixed[aria-label="Navigation principale"]');
    const [l, t] = [await launcher.boundingBox(), await tabBar.boundingBox()];
    expect(l.y + l.height).toBeLessThanOrEqual(t.y); // au-dessus de la barre
  }
});
