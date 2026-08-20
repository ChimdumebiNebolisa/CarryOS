import { expect, test } from '@playwright/test'

test('landing explains the product and keeps the demo separate', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Know before you go.' })).toBeVisible()
  await expect(page.getByText('CarryOS knows what you’ll need today, checks what’s already with you, and warns you before you leave something important behind.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your bag changes because your day changes.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Carry knows what’s already with you.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Notebook missing.' })).toHaveCount(1)
  await expect(page.locator('.landing-inventory-item')).toHaveCount(3)
  await expect(page.locator('.landing-inventory-composition')).not.toContainText('MISSING')
  await expect(page.getByRole('heading', { name: 'Coming next.' })).toHaveCount(0)
  await expect(page.getByText('You’ll need it for Algorithms at 10:00 AM.')).toBeVisible()
  await expect(page.locator('.landing-hero .landing-callout')).toHaveCount(0)
  await expect(page.locator('.landing-hero .landing-backpack-statuses')).toHaveCount(0)
  await expect(page.locator('a[href="/demo"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'View on GitHub' }).first()).toHaveAttribute('href', /github\.com/)
  const landingText = await page.locator('body').innerText()
  for (const phrase of ['↗', 'View the source', 'reconciliation engine', 'confidence meter', 'system architecture', 'contextual signals']) {
    expect(landingText).not.toContain(phrase)
  }
})

test('landing navigation scrolls to the bag section and stays visible', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'See how it works' }).click()
  await expect(page).toHaveURL(/#how-it-works$/)
  await expect(page.getByRole('heading', { name: 'How Carry works' })).toBeInViewport()
  await expect(page.getByRole('link', { name: 'Inside the bag' })).toBeVisible()
  await page.getByRole('link', { name: 'Inside the bag' }).click()
  await expect(page).toHaveURL(/#inside-the-bag$/)
  await expect(page.getByRole('heading', { name: 'Carry knows what’s already with you.' })).toBeInViewport()
  const navTop = await page.locator('.landing-nav').evaluate((node) => Math.round(node.getBoundingClientRect().top))
  expect(navTop).toBe(0)
})

test('missing notebook flow', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByTestId('readiness')).toHaveText('Scan required')
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toHaveText('Item missing')
  await page.getByTestId('explain-alert').click()
  await expect(page.getByTestId('alert-summary')).toContainText('Notebook not detected')
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByTestId('add-notebook').click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toContainText('Ready for Algorithms')
})

test('AI approval does not apply until approved', async ({ page }) => {
  await page.goto('/demo')
  await page.getByTestId('generate-profile').click()
  await expect(page.getByTestId('ai-status')).toHaveText('Deterministic fallback')
  await expect(page.getByTestId('readiness')).toHaveText('Scan required')
})

test('failed scan cannot become ready', async ({ page }) => {
  await page.goto('/demo')
  await page.getByTestId('arm-fail').click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toHaveText('Sensor unavailable')
})

test('opening the bag after a ready scan makes evidence stale', async ({ page }) => {
  await page.goto('/demo')
  await page.getByTestId('add-notebook').click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toContainText('Ready for Algorithms')
  await page.getByRole('button', { name: 'Open bag' }).click()
  await expect(page.getByTestId('readiness')).not.toContainText('Ready for Algorithms')
})
