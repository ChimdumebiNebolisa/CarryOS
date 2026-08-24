import { expect, test } from '@playwright/test'

test('no horizontal overflow at required widths', async ({ page }) => {
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/how-it-works', '/demo']) {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
      expect(overflow, `overflow at ${width} on ${path}`).toBe(false)
    }
  }
})
