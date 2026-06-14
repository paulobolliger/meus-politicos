import { expect, test } from '@playwright/test'

const protectedRoutes = ['/painel', '/painel/meus-politicos', '/painel/comparar', '/conta']

for (const route of protectedRoutes) {
  test(`${route} requires authentication`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
  })
}

test('/admin does not expose the dashboard without authentication', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login(?:\?|$)/)
})
