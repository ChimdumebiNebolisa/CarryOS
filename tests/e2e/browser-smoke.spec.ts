import { expect, test } from '@playwright/test'

test('homepage survives the supported-browser visual smoke path', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Know before you go.' })).toBeVisible()
  await expect(page.getByRole('img', { name: /backpack/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'How it works' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Source code' })).toBeVisible()
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1)
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1)
})
