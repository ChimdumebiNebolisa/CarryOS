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

test('snooze expires through the reachable advancing product clock', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-05T14:21:00.000Z') })
  await page.goto('/demo')
  await page.getByTestId('close-scan').click()
  await page.getByRole('button', { name: 'Snooze 30 min' }).click()
  await expect(page.getByTestId('alert-count')).toHaveText('0 actionable')

  await page.clock.fastForward(29 * 60_000)
  await expect(page.getByTestId('alert-count')).toHaveText('0 actionable')
  await expect(page.getByTestId('explain-alert')).toHaveCount(0)

  await page.clock.fastForward(2 * 60_000)
  await expect(page.getByTestId('alert-count')).toHaveText('1 actionable')
  await expect(page.getByTestId('explain-alert')).toBeVisible()
  await expect(page.getByText('alert-reactivated:', { exact: false })).toBeVisible()
})

test('a distinct scan refreshes alert evidence without duplicate notification', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-05T14:21:00.000Z') })
  await page.goto('/demo')
  await page.getByTestId('close-scan').click()
  await page.clock.fastForward(60_000)
  await page.getByTestId('close-scan').click()

  await expect(page.getByTestId('alert-count')).toHaveText('1 actionable')
  await expect(page.getByRole('button', { name: 'Notebook not detected' })).toHaveCount(1)
  await expect(page.getByText('alert-updated:', { exact: false })).toBeVisible()
  await page.getByTestId('explain-alert').click()
  await expect(page.getByRole('dialog')).toContainText('Latest scan: 9:22 AM')
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

test('dialog closes and focuses the alert region when its underlying alert resolves', async ({ page }) => {
  await page.goto('/demo')
  await page.getByTestId('close-scan').click()
  await page.getByTestId('explain-alert').click()
  await expect(page.getByRole('dialog', { name: 'Alert evidence' })).toBeVisible()

  await page.getByTestId('add-notebook').evaluate((element) => (element as HTMLButtonElement).click())
  await page.getByTestId('close-scan').evaluate((element) => (element as HTMLButtonElement).click())
  await expect(page.getByRole('dialog', { name: 'Alert evidence' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Alerts' })).toBeFocused()
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

test('a superseded AI request is aborted and cannot replace the newer result', async ({ page }) => {
  let requestCount = 0
  let failedRequests = 0
  page.on('requestfailed', (request) => {
    if (request.url().includes('/api/carry-profile')) failedRequests += 1
  })
  await page.route('**/api/carry-profile', async (route) => {
    requestCount += 1
    const current = requestCount
    await new Promise((resolve) => setTimeout(resolve, current === 1 ? 400 : 20))
    await route
      .fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'fallback',
          requiredItems: [
            {
              itemId: current === 1 ? 'notebook' : 'calculator',
              confidence: 0.9,
              reason: current === 1 ? 'OLD' : 'NEW',
              evidenceType: 'inferred',
            },
          ],
          optionalItems: [],
          excludedItems: [],
          unregisteredSuggestions: [],
        }),
      })
      .catch(() => undefined)
  })

  await page.goto('/demo')
  await page.getByTestId('generate-profile').evaluate((element) => {
    const button = element as HTMLButtonElement
    button.click()
    button.click()
  })
  await expect.poll(() => requestCount).toBe(2)
  await expect(page.getByText('NEW')).toBeVisible()
  await expect(page.getByText('OLD', { exact: true })).toHaveCount(0)
  await expect.poll(() => failedRequests).toBeGreaterThanOrEqual(1)
})

test('browser notifications include alerts created by approved requirements', async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as typeof window & { __notificationCount: number }
    target.__notificationCount = 0
    class FakeNotification {
      static permission: NotificationPermission = 'default'
      static async requestPermission(): Promise<NotificationPermission> {
        FakeNotification.permission = 'granted'
        return 'granted'
      }
      constructor() {
        target.__notificationCount += 1
      }
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: FakeNotification })
  })
  await page.route('**/api/carry-profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'fallback',
        requiredItems: [
          { itemId: 'calculator', confidence: 0.9, reason: 'Required for the exercise.', evidenceType: 'inferred' },
        ],
        optionalItems: [],
        excludedItems: [],
        unregisteredSuggestions: [],
      }),
    })
  })

  await page.goto('/demo')
  await page.getByRole('button', { name: 'Enable browser notifications' }).click()
  await page.getByTestId('close-scan').click()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __notificationCount: number }).__notificationCount)).toBe(1)

  await page.getByTestId('generate-profile').click()
  await page.locator('li').filter({ hasText: 'Calculator' }).getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByTestId('alert-count')).toHaveText('2 actionable')
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __notificationCount: number }).__notificationCount)).toBe(2)
})
