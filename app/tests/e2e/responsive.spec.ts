import { expect, test } from '@playwright/test'

const routes = [
  '/',
  '/busca',
  '/estado',
  '/projetos',
  '/partidos',
  '/camara',
  '/camara/comissoes',
  '/senado',
  '/senado/comissoes',
  '/cidades',
  '/emendas',
  '/estado/sp/assembleia',
  '/estado/sp/executivo',
  '/estado/sp/sao-paulo-sp',
  '/estado/sp/sao-paulo-sp/camara',
  '/estado/sp/sao-paulo-sp/camara/vereador/lucas-pavanato-sp',
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/recuperar-senha/confirmar',
  '/apoio',
  '/apoio/confirmacao',
  '/confirmacao',
  '/erro',
  '/indisponivel',
  '/manutencao',
  '/acesso-negado',
  '/eleicao',
]

for (const route of routes) {
  test(`${route} has no document-level horizontal overflow`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('domcontentloaded')

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            tag: element.tagName,
            text: element.textContent?.trim().slice(0, 80) ?? '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          }
        })
        .filter(({ left, right }) => left < -1 || right > document.documentElement.clientWidth + 1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 5),
    }))

    expect(
      dimensions.scrollWidth,
      JSON.stringify(dimensions.offenders, null, 2),
    ).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  })
}

test('public politician profile has no document-level horizontal overflow', async ({ page }) => {
  await page.goto('/busca')
  const firstProfile = page.getByTestId('politico-card-link').first()

  await expect(firstProfile).toBeVisible({ timeout: 15_000 })
  const profileHref = await firstProfile.getAttribute('href')
  expect(profileHref).toMatch(/^\/politicos\//)
  await page.goto(profileHref!)
  await expect(page).toHaveURL(/\/politicos\//)

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
})

const detailSources = [
  { source: '/estado', href: /^\/estado\/[a-z]{2}$/ },
  { source: '/partidos', href: /^\/partidos\/[^/]+$/ },
  { source: '/projetos', href: /^\/projetos\/[^/]+$/ },
  { source: '/eleicao/2026', href: /^\/eleicao\/2026\/.+/ },
  { source: '/camara/comissoes', href: /^\/camara\/comissoes\/[^/]+$/ },
  { source: '/senado/comissoes', href: /^\/senado\/comissoes\/[^/]+$/ },
  { source: '/emendas', href: /^\/emendas\/[^/]+$/ },
  { source: '/estado/sp/assembleia', href: /^\/estado\/sp\/assembleia\/[^/]+$/ },
]

for (const { source, href } of detailSources) {
  test(`first detail linked from ${source} has no document-level horizontal overflow`, async ({ page }) => {
    await page.goto(source)
    const detailLink = page.locator('a[href]').evaluateAll(
      (links, pattern) => {
        const regex = new RegExp(pattern)
        return links
          .map((link) => link.getAttribute('href'))
          .find((value): value is string => Boolean(value && regex.test(value))) ?? null
      },
      href.source,
    )
    const detailHref = await detailLink

    test.skip(!detailHref, `No detail link found on ${source}`)
    await page.goto(detailHref!)

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            tag: element.tagName,
            text: element.textContent?.trim().slice(0, 80) ?? '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          }
        })
        .filter(({ left, right }) => left < -1 || right > document.documentElement.clientWidth + 1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 5),
    }))

    expect(
      dimensions.scrollWidth,
      JSON.stringify(dimensions.offenders, null, 2),
    ).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  })
}
