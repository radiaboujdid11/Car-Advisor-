import { expect } from '@playwright/test';

/** Aucun défilement horizontal de la page. */
export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'débordement horizontal (px)').toBeLessThanOrEqual(0);
}

/** Tous les boutons et liens visibles font au moins 44 × 44 px (sauf exceptions listées). */
export async function expectTouchTargets(page, { ignore = [] } = {}) {
  const tooSmall = await page.evaluate((ignored) => {
    return [...document.querySelectorAll('a[href], button')]
      .filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (s.visibility === 'hidden' || s.display === 'none' || r.width === 0) return false;
        if (el.getAttribute('tabindex') === '-1') return false;
        if (ignored.some((t) => el.innerText.includes(t))) return false;
        return r.width < 44 || r.height < 44;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${el.innerText.trim().slice(0, 30)} (${Math.round(r.width)}×${Math.round(r.height)})`;
      });
  }, ignore);
  expect(tooSmall, 'cibles tactiles < 44 px').toEqual([]);
}

/** Joue le quiz jusqu'à la proposition intermédiaire (15 réponses), en touchant la réponse `pick`. */
export async function answerUntilInterim(page, pick = 0) {
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('button', { name: /Voir mon résultat final/i }).isVisible()) return;
    const cont = page.getByRole('button', { name: /^Continuer/ });
    if (await cont.isVisible()) {
      await cont.click();
      continue;
    }
    const answers = page.getByTestId('answer');
    await answers.first().waitFor();
    await answers.nth(pick).click();
    await page.waitForTimeout(300);
  }
  throw new Error("La proposition intermédiaire n'est pas apparue");
}

/**
 * Tests indépendants du réseau : bloque les images externes (moteur.ma, Unsplash)
 * et, sauf demande contraire, la vidéo de fond (7 Mo) qui sature le processeur en parallèle.
 */
export async function isolateNetwork(page, { allowVideo = false } = {}) {
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  );
  if (!allowVideo) await page.route('**/*.mp4', (route) => route.abort());
}
