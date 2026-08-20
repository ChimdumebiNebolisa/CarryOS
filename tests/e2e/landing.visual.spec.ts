import { expect, test, type Page } from '@playwright/test'

async function openStableLanding(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForFunction(async () => {
    await document.fonts.ready
    return Array.from(document.images).every((image) => image.complete)
  })
}

test('landing visual contract at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openStableLanding(page)
  await expect(page).toHaveScreenshot('landing-1440.png', { animations: 'disabled', fullPage: true, maxDiffPixelRatio: 0.003 })
})

test('landing visual contract at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openStableLanding(page)
  await expect(page).toHaveScreenshot('landing-390.png', { animations: 'disabled', fullPage: true, maxDiffPixelRatio: 0.003 })
})
