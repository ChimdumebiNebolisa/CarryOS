import { expect, test } from '@playwright/test'

test('acknowledge, snooze, resolve, and re-alert remain coherent', async ({ page }) => {
  await page.goto('/demo')
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('alert-count')).toHaveText('1 actionable')
  await expect(page.getByRole('button', { name: 'Notebook not detected' })).toBeVisible()

  await page.getByRole('button', { name: 'Acknowledge' }).click()
  await expect(page.getByTestId('alert-count')).toHaveText('0 actionable')
  await expect(page.getByText('acknowledged', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Notebook not detected' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Snooze 30 min' }).click()
  await expect(page.getByTestId('alert-count')).toHaveText('0 actionable')
  await expect(page.getByTestId('explain-alert')).toHaveCount(0)

  await page.getByTestId('add-notebook').click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toContainText('Ready for Algorithms')
  await expect(page.getByTestId('alert-count')).toHaveText('0 actionable')

  await page.getByRole('button', { name: 'Remove notebook' }).click()
  await page.getByTestId('close-scan').click()
  await expect(page.getByTestId('readiness')).toHaveText('Item missing')
  await expect(page.getByTestId('alert-count')).toHaveText('1 actionable')
  await expect(page.getByRole('button', { name: 'Notebook not detected' })).toBeVisible()
})

test('alert dialog restores focus and has a programmatic description', async ({ page }) => {
  await page.goto('/demo')
  await page.getByTestId('close-scan').click()
  const explain = page.getByTestId('explain-alert')
  await explain.focus()
  await explain.click()

  const dialog = page.getByRole('dialog', { name: 'Alert evidence' })
  await expect(dialog).toBeVisible()
  const descriptionId = await dialog.getAttribute('aria-describedby')
  expect(descriptionId).toBeTruthy()
  await expect(page.locator(`#${descriptionId}`)).toContainText('Notebook not detected')

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(explain).toBeFocused()
})

test('reset invalidates pending AI work and clears transient UI state', async ({ page }) => {
  await page.route('**/api/carry-profile', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    await route
      .fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'fallback',
          requiredItems: [],
          optionalItems: [],
          excludedItems: [],
          unregisteredSuggestions: [],
        }),
      })
      .catch(() => undefined)
  })

  await page.goto('/demo')
  await page.getByTestId('generate-profile').click()
  await expect(page.getByTestId('ai-status')).toHaveText('Generating suggestions...')
  await page.getByTestId('reset-demo').click()
  await expect(page.getByTestId('ai-status')).toBeEmpty()
  await expect(page.getByText('No model suggestions yet.')).toBeVisible()
  await expect(page.getByTestId('generate-profile')).toBeEnabled()
  await page.waitForTimeout(600)
  await expect(page.getByTestId('ai-status')).toBeEmpty()
  await expect(page.getByText('No model suggestions yet.')).toBeVisible()
})
