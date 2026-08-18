import { devices, expect, test as base, type Page, type TestInfo } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'owner@rasikapriya.local'
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'rasikapriya-local-admin'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(adminEmail)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Inventory Dashboard' })).toBeVisible()
}

const test = base.extend<Record<never, never>, { sharedPage: Page }>({
  sharedPage: [async ({ browser }, use, workerInfo) => {
    const device = workerInfo.project.name === 'mobile-chromium' ? devices['Pixel 7'] : devices['Desktop Chrome']
    const context = await browser.newContext({ ...device, baseURL: String(workerInfo.project.use.baseURL) })
    const page = await context.newPage()
    await authenticate(page)
    await use(page)
    await context.close()
  }, { scope: 'worker' }],
})

async function login(page: Page) {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Inventory Dashboard' })).toBeVisible()
}

function failOnConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, 'browser console or page errors').toEqual([])
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
}

async function normalizeAcceptanceItemLifecycle(page: Page) {
  await page.goto('/inventory/YP-S01-BL')
  await expect(page.getByRole('heading', { name: 'YP-S01-BL' })).toBeVisible()
  if (await page.getByText('Cleaning', { exact: true }).isVisible().catch(() => false)) {
    await page.getByRole('combobox', { name: 'Change lifecycle' }).selectOption('ACTIVE')
    await page.getByRole('button', { name: 'Change lifecycle' }).click()
    await page.getByRole('button', { name: 'Confirm lifecycle' }).click()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
  }
}

async function removeAcceptanceItemPhotos(page: Page) {
  await page.goto('/inventory/YP-S01-BL')
  await expect(page.getByRole('heading', { name: 'YP-S01-BL' })).toBeVisible()
  const removeButtons = page.getByRole('button', { name: 'Remove Reference photo' })
  while (await removeButtons.count()) {
    const count = await removeButtons.count()
    await removeButtons.first().click()
    await expect(removeButtons).toHaveCount(count - 1)
  }
}

test('owner can inspect seeded inventory and open an item by manual scan', async ({ sharedPage: page }, testInfo) => {
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)

  const totalInventory = page.getByRole('link', { name: /Total inventory/ })
  await expect(totalInventory).toContainText('90')
  await capture(page, testInfo, 'dashboard')

  await page.getByRole('link', { name: 'Inventory', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search inventory' }).fill('YP-S01-BL')
  await expect(page).toHaveURL(/query=YP-S01-BL/)
  const itemCard = page.getByRole('article').filter({ hasText: 'YP-S01-BL' })
  await expect(itemCard).toContainText('Yellow and Pink')
  await expect(itemCard).toContainText('Blouse')
  await itemCard.getByRole('link', { name: 'View item' }).click()
  await expect(page.getByRole('heading', { name: 'YP-S01-BL' })).toBeVisible()
  await expect(page.getByText('Identity is permanent:')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Label' })).toBeVisible()

  await page.getByRole('link', { name: 'Scan', exact: true }).first().click()
  await page.getByLabel('Enter inventory code').fill('YP-S01-BL')
  await page.getByRole('button', { name: 'Find item' }).click()
  await expect(page).toHaveURL(/\/inventory\/YP-S01-BL$/)
  await expect(page.getByRole('heading', { name: 'YP-S01-BL' })).toBeVisible()
  await capture(page, testInfo, 'inventory-detail')
  assertNoConsoleErrors()
})

test('mobile navigation reaches owner configuration screens', async ({ sharedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only navigation acceptance')
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  const mobileMenu = page.getByRole('navigation', { name: 'More navigation' })
  await expect(mobileMenu).toBeVisible()
  await mobileMenu.getByRole('link', { name: 'Configuration' }).click()
  await expect(page.getByRole('heading', { name: /Configuration/ })).toBeVisible()
  await capture(page, testInfo, 'mobile-configuration')
  assertNoConsoleErrors()
})

test('inventory lifecycle changes are reversible and recorded', async ({ sharedPage: page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Run this stateful workflow once')
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await normalizeAcceptanceItemLifecycle(page)
  try {
    await page.getByRole('combobox', { name: 'Change lifecycle' }).selectOption('CLEANING')
    await page.getByRole('button', { name: 'Change lifecycle' }).click()
    await page.getByRole('button', { name: 'Confirm lifecycle' }).click()
    await expect(page.getByText('Cleaning', { exact: true })).toBeVisible()
    await expect(page.getByRole('list').filter({ hasText: 'LIFECYCLE CHANGED' })).toBeVisible()
  } finally {
    await normalizeAcceptanceItemLifecycle(page)
  }
  assertNoConsoleErrors()
})

test('administrator account limit is enforced in the owner UI', async ({ sharedPage: page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Run this invariant once')
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/administrators')
  await expect(page.getByRole('heading', { name: 'Administrators' })).toBeVisible()
  await expect(page.getByText('Active administrator')).toHaveCount(2)

  await page.getByRole('button', { name: 'Add administrator' }).click()
  await page.getByLabel('Name').fill('Third Administrator')
  await page.getByLabel('Email').fill('third-local@example.com')
  await page.getByLabel('Password').fill('local-acceptance-password')
  assertNoConsoleErrors()
  await page.getByRole('button', { name: 'Save administrator' }).click()
  await expect(page.getByRole('alert')).toContainText(/maximum|two administrator/i)
  await expect(page.getByText('Active administrator')).toHaveCount(2)
})

test('a local costume photo survives reload and can be removed', async ({ sharedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Run this stateful workflow once')
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await removeAcceptanceItemPhotos(page)
  try {
    await page.getByLabel('Add photo').setInputFiles({
      name: 'acceptance-costume.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YKmvCsAAAAASUVORK5CYII=', 'base64'),
    })
    await expect(page.getByRole('button', { name: 'Load photo' })).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Load photo' }).click()
    await expect(page.getByRole('img', { name: 'Reference photo' })).toBeVisible()
    await capture(page, testInfo, 'inventory-photo')
  } finally {
    await removeAcceptanceItemPhotos(page)
  }
  await expect(page.getByRole('region', { name: 'Attached photos' })).toHaveCount(0)
  assertNoConsoleErrors()
})

test('printing a QR label records an audit event before print', async ({ sharedPage: page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Run this stateful workflow once')
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/inventory/YP-S01-BL')
  await expect(page.getByRole('img', { name: 'QR code for YP-S01-BL' })).toBeVisible()
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printInvoked = 'true' } })
  await page.getByRole('button', { name: 'Print label' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-print-invoked', 'true')
  await page.reload()
  await expect(page.getByRole('list').filter({ hasText: 'LABEL PRINTED' })).toBeVisible()
  assertNoConsoleErrors()
})

test('owner can resume an incomplete original-set onboarding workflow', async ({ sharedPage: page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Run this workflow once')
  await login(page)
  const assertNoConsoleErrors = failOnConsoleErrors(page)
  await page.goto('/original-sets')
  await expect(page.getByRole('heading', { name: 'Original sets' })).toBeVisible()
  await expect(page.getByLabel('Original set summary')).toContainText('24 Verified')
  await expect(page.getByLabel('Original set summary')).toContainText('6 In progress')
  await page.getByRole('button', { name: /^Resume [A-Z]{2}-S\d{2}$/ }).first().click()
  await expect(page.getByRole('heading', { name: /Original set [A-Z]{2}-S\d{2}/ })).toBeVisible()
  const progress = page.getByRole('list', { name: 'Onboarding progress' })
  await expect(progress).toContainText('Set')
  await expect(progress).toContainText('Photo')
  await expect(progress).toContainText('Pieces')
  await expect(progress).toContainText('Labels')
  await expect(progress).toContainText('Verify')
  assertNoConsoleErrors()
})
