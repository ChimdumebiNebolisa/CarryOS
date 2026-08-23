import { expect, test, type Locator, type Page } from '@playwright/test'

type ButtonStyle = { background: string; color: string; outlineWidth: string; outlineStyle: string; opacity: string }

async function styles(locator: Locator): Promise<ButtonStyle> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, color: style.color, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, opacity: style.opacity }
  })
}

function expectOpaque(style: ButtonStyle) {
  expect(style.background).not.toBe('rgba(0, 0, 0, 0)')
  expect(style.background).not.toBe('transparent')
}

function expectReadable(style: ButtonStyle) {
  expect(style.color).not.toBe('rgba(0, 0, 0, 0)')
  expect(style.color).not.toBe(style.background)
}

async function expectValidControlStates(page: Page, locator: Locator, { allowsTransparentBase = false }: { allowsTransparentBase?: boolean } = {}) {
  const base = await styles(locator)
  if (!allowsTransparentBase) expectOpaque(base)
  expectReadable(base)

  await locator.hover()
  await page.waitForTimeout(180)
  const hover = await styles(locator)
  expectOpaque(hover)
  expectReadable(hover)

  await page.mouse.down()
  const active = await styles(locator)
  if (!allowsTransparentBase) expectOpaque(active)
  expectReadable(active)
  await page.mouse.up()

  await locator.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(locator).toBeFocused()
  const focus = await styles(locator)
  expect(focus.outlineStyle).not.toBe('none')
  expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThan(0)

  await locator.evaluate((element) => element.setAttribute('disabled', ''))
  const disabled = await styles(locator)
  if (!allowsTransparentBase) expectOpaque(disabled)
  expect(Number(disabled.opacity)).toBeGreaterThan(0)
  expect(Number(disabled.opacity)).toBeLessThan(1)
}

async function openDemo(page: Page) {
  await page.goto('/demo')
  await page.waitForLoadState('domcontentloaded')
}

test('shared Button semantic states remain visible in the browser', async ({ page }) => {
  await openDemo(page)

  await expectValidControlStates(page, page.getByTestId('close-scan'))
  await expectValidControlStates(page, page.getByTestId('arm-fail'))
  await expectValidControlStates(page, page.getByRole('button', { name: 'Open bag' }))
  await expectValidControlStates(page, page.getByTestId('add-notebook'), { allowsTransparentBase: true })
})

test('homepage CTAs and keyboard focus stay usable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'How it works', exact: true }).click()
  await expect(page).toHaveURL(/\/how-it-works$/)

  await page.goto('/')
  const howItWorks = page.getByRole('link', { name: 'How it works', exact: true })
  await howItWorks.focus()
  await expect(howItWorks).toBeFocused()
  const focusStyle = await styles(howItWorks)
  expect(focusStyle.outlineStyle).not.toBe('none')
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reducedDuration = await howItWorks.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))
  expect(reducedDuration).toBeLessThanOrEqual(0.00002)
})
