import { expect, test } from '@playwright/test'

test('homepage explains the product without promoting the demo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Know before you go.' })).toBeVisible()
  await expect(page.getByText('CarryOS determines what you need for the day, checks what is already with you, and warns you before you leave something important behind.')).toBeVisible()
  await expect(page.locator('a[href="/demo"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', /github\.com/)
  await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/how-it-works')
})

test('homepage how-it-works CTA opens the architecture page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'How it works' }).click()
  await expect(page).toHaveURL(/\/how-it-works$/)
  await expect(page.getByRole('heading', { name: 'How context becomes an intervention.' })).toBeVisible()
  await expect(page.locator('.arch-canvas .react-flow')).toBeVisible()
  await expect(page.getByText('RFID observation is simulated')).toBeVisible()
})

test('architecture explorer focuses regions and selects nodes', async ({ page }) => {
  await page.goto('/how-it-works')
  await expect(page.locator('.arch-panel h2')).toHaveText('Readiness Engine')

  await page.getByRole('button', { name: 'Observation' }).click()
  await page.waitForTimeout(600)
  const canvas = (await page.locator('.arch-canvas').boundingBox())!
  const node = (await page.locator('.react-flow__node').filter({ hasText: 'Registered Items' }).boundingBox())!
  expect(node.x).toBeGreaterThanOrEqual(canvas.x)
  expect(node.y).toBeGreaterThanOrEqual(canvas.y)
  expect(node.x + node.width).toBeLessThanOrEqual(canvas.x + canvas.width + 1)
  expect(node.y + node.height).toBeLessThanOrEqual(canvas.y + canvas.height + 1)

  await page.getByTestId('rf__node-belief').click()
  await expect(page.locator('.arch-panel h2')).toHaveText('Inventory Belief')
  await expect(page.locator('.arch-panel')).toContainText('src/domain/inventory.ts')

  await page.getByRole('button', { name: 'Overview' }).click()
  await expect(page.locator('.arch-panel-hint')).toBeVisible()
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
