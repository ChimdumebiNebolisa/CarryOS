import { expect, test } from '@playwright/test'

test('no horizontal overflow at required widths', async ({ page }) => {
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    expect(overflow, `overflow at ${width}`).toBe(false)
    await page.goto('/demo')
    const demoOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    expect(demoOverflow, `demo overflow at ${width}`).toBe(false)
  }
})
