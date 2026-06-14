import { expect, test } from '@playwright/test'

for (const route of ['/camara', '/senado']) {
  test(`${route} hydrates without mismatch warnings`, async ({ page }) => {
    const hydrationWarnings: string[] = []

    page.on('console', (message) => {
      const text = message.text()
      if (/hydration|hydrated.*didn't match/i.test(text)) {
        hydrationWarnings.push(text)
      }
    })

    await page.goto(route)
    await page.waitForLoadState('networkidle')

    expect(hydrationWarnings).toEqual([])
  })
}
