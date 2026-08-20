import { expect, test } from '@playwright/test'

test('landing CTA opens the demo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Carry less uncertainty.' })).toBeVisible()
  await page.getByTestId('run-demo').click()
  await expect(page).toHaveURL(/\/demo/)
  await expect(page.getByTestId('readiness')).toHaveText('Scan required')
})

test('missing calculator flow', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByTestId('readiness')).toHaveText('Scan required')
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toHaveText('Item missing')
  await page.getByTestId('explain-alert').click()
  await expect(page.getByTestId('alert-summary')).toContainText('Calculator not detected')
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByTestId('add-calculator').click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toContainText('Ready for Calculus II')
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
  await page.getByTestId('add-calculator').click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toContainText('Ready for Calculus II')
  await page.getByRole('button', { name: 'Open bag' }).click()
  await expect(page.getByTestId('readiness')).not.toContainText('Ready for Calculus II')
})
