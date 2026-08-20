import { expect, test } from '@playwright/test'

test('landing survives the supported-browser visual smoke path', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Know before you go.' })).toBeVisible()
  await expect(page.locator('.landing-backpack-image')).toBeVisible()
  await page.locator('.landing-final-cta').scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: /Turn the things you carry/i })).toBeVisible()
  const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1)
})
