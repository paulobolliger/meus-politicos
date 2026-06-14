import { expect, test } from '@playwright/test'

test('legacy meu-estado route redirects to the canonical state hub', async ({ page }) => {
  await page.goto('/meu-estado?cep=01001000')

  await expect(page).toHaveURL(/\/estado(?:\?.*)?$/)
})

test('homepage text search uses the canonical search route', async ({ page }) => {
  await page.goto('/')
  const input = page.getByPlaceholder('Nome, cargo, partido ou estado')

  await input.fill('Tabata Amaral')
  await input.press('Enter')

  await expect(page).toHaveURL(/\/busca\?q=Tabata(\+|%20)Amaral/)
})
