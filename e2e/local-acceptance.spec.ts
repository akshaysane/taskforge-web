import { devices, expect, test as base, type Locator, type Page, type TestInfo } from '@playwright/test'

const adminUsername = process.env.E2E_ADMIN_USERNAME ?? 'srnatiya-admin'
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'srnatiya-local-admin'
const codeChangeWarning = 'Changing this Design Code will also update the generated Original Set and Inventory codes associated with this design. Existing database relationships and rental history will remain unchanged.'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill(adminUsername)
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

async function expectNoFrameworkOverlay(page: Page) {
  await expect(page.locator('vite-error-overlay, nextjs-portal')).toHaveCount(0)
}

async function expectQrCodeReadable(qrLabel: Locator, expectedCode: string) {
  const code = qrLabel.locator('.qr-label-copy strong')
  await expect(code).toHaveText(expectedCode)
  const metrics = await code.evaluate((element) => {
    const label = element.closest('.qr-label') as HTMLElement | null
    return {
      codeClientWidth: element.clientWidth,
      codeScrollWidth: element.scrollWidth,
      labelClientHeight: label?.clientHeight ?? 0,
      labelClientWidth: label?.clientWidth ?? 0,
      labelScrollHeight: label?.scrollHeight ?? 0,
      labelScrollWidth: label?.scrollWidth ?? 0,
    }
  })
  expect(metrics.codeScrollWidth).toBeLessThanOrEqual(metrics.codeClientWidth)
  expect(metrics.labelScrollWidth).toBeLessThanOrEqual(metrics.labelClientWidth)
  expect(metrics.labelScrollHeight).toBeLessThanOrEqual(metrics.labelClientHeight)
}

async function editRoyalGreenDesignCode(page: Page, nextCode: 'RG' | 'RG_E2E') {
  await page.goto('/designs')
  await expect(page.getByRole('heading', { name: 'Designs' })).toBeVisible()
  const designRow = page.getByRole('article').filter({ hasText: 'Royal Green' })
  await expect(designRow).toBeVisible()
  await designRow.getByRole('link', { name: 'Edit Royal Green' }).click()
  await expect(page.getByRole('heading', { name: 'Edit design' })).toBeVisible()

  const designCode = page.getByLabel('Design code')
  if (await designCode.inputValue() === nextCode) {
    await expect(designCode).toHaveValue(nextCode)
    await page.getByRole('button', { name: 'Close design editor' }).click()
    await expect(page).toHaveURL(/\/designs$/)
    await expect(page.getByRole('article').filter({ hasText: 'Royal Green' }).locator('strong').first()).toHaveText(nextCode)
    return
  }
  await designCode.fill(nextCode)
  await page.getByRole('button', { name: 'Save design' }).click()

  const confirmation = page.getByRole('dialog', { name: 'Confirm Design Code change' })
  await expect(confirmation).toBeVisible()
  await expect(confirmation.getByText(codeChangeWarning, { exact: true })).toBeVisible()
  await confirmation.getByRole('button', { name: 'Change Design Code' }).click()
  await expect(page).toHaveURL(/\/designs$/)
  await expect(page.getByRole('heading', { name: 'Designs' })).toBeVisible()
  await expect(page.getByRole('article').filter({ hasText: 'Royal Green' }).locator('strong').first()).toHaveText(nextCode)
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
  await expect(page.getByText('Internal item identity and lineage remain permanent.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Label' })).toBeVisible()

  await page.getByRole('link', { name: 'Scan', exact: true }).first().click()
  await page.getByLabel('Enter inventory code').fill('YP-S01-BL')
  await page.getByRole('button', { name: 'Find item' }).click()
  await expect(page).toHaveURL(/\/inventory\/items\/[0-9a-f-]{36}$/i)
  await expect(page.getByRole('heading', { name: 'YP-S01-BL' })).toBeVisible()
  await capture(page, testInfo, 'inventory-detail')
  assertNoConsoleErrors()
})

test('editing a Design Code restores exact current display codes while preserving historical aliases', async ({ sharedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only editable-code acceptance')
  await login(page)
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  const itemResponsePromise = page.waitForResponse((response) => response.request().method() === 'GET'
    && new URL(response.url()).pathname.endsWith('/api/inventory-items/by-code/RG-S01-BL')
    && response.ok())

  await page.goto('/inventory/RG-S01-BL')
  const originalItem = await (await itemResponsePromise).json() as { id: string }
  expect(originalItem.id).toMatch(/^[0-9a-f-]{36}$/i)
  await expect(page.getByRole('heading', { name: 'RG-S01-BL' })).toBeVisible()

  let workflowError: unknown
  let cleanupError: unknown
  try {
    await editRoyalGreenDesignCode(page, 'RG_E2E')
    await expectNoFrameworkOverlay(page)

    await page.goto(`/inventory/items/${originalItem.id}`)
    await expect(page).toHaveURL(new RegExp(`/inventory/items/${originalItem.id}$`))
    await expect(page).toHaveTitle('Nritya Alankara Collections')
    await expect(page.getByRole('heading', { name: 'RG_E2E-S01-BL' })).toBeVisible()
    const currentQrLabel = page.getByRole('region', { name: 'QR label for RG_E2E-S01-BL' })
    await expect(currentQrLabel.getByRole('img', { name: 'QR code for RG_E2E-S01-BL' })).toBeVisible()
    await expectQrCodeReadable(currentQrLabel, 'RG_E2E-S01-BL')
    await expectNoFrameworkOverlay(page)
    await capture(page, testInfo, 'editable-code-uuid-route')

    const maximumGeneratedInventoryCode = 'ABCDEFGHIJKLMNOPQRST-S2147483647-ABCDEFGHIJ-32767'
    const currentCode = currentQrLabel.locator('.qr-label-copy strong')
    await currentCode.evaluate((element, code) => { element.textContent = code }, maximumGeneratedInventoryCode)
    await expectQrCodeReadable(currentQrLabel, maximumGeneratedInventoryCode)
    await capture(page, testInfo, 'editable-code-maximum-generated-qr')
    await currentCode.evaluate((element) => { element.textContent = 'RG_E2E-S01-BL' })

    const legacyResponsePromise = page.waitForResponse((response) => response.request().method() === 'GET'
      && new URL(response.url()).pathname.endsWith('/api/inventory-items/by-code/RG-S01-BL')
      && response.ok())
    await page.goto('/inventory/RG-S01-BL')
    const legacyItem = await (await legacyResponsePromise).json() as { id: string }
    expect(legacyItem.id).toBe(originalItem.id)
    await expect(page).toHaveURL(/\/inventory\/RG-S01-BL$/)
    await expect(page.getByRole('heading', { name: 'RG_E2E-S01-BL' })).toBeVisible()
    const legacyQrLabel = page.getByRole('region', { name: 'QR label for RG_E2E-S01-BL' })
    await expect(legacyQrLabel.getByRole('img', { name: 'QR code for RG_E2E-S01-BL' })).toBeVisible()
    await expectQrCodeReadable(legacyQrLabel, 'RG_E2E-S01-BL')
    await expectNoFrameworkOverlay(page)
    await capture(page, testInfo, 'editable-code-legacy-alias')
  } catch (error) {
    workflowError = error
  } finally {
    try {
      await editRoyalGreenDesignCode(page, 'RG')
      await expectNoFrameworkOverlay(page)
      const restoredRow = page.getByRole('article').filter({ hasText: 'Royal Green' })
      await expect(restoredRow.locator('strong').first()).toHaveText('RG')

      // Reversible acceptance restores exact current display codes; historical aliases intentionally persist.
      const restoredAliasResponsePromise = page.waitForResponse((response) => response.request().method() === 'GET'
        && new URL(response.url()).pathname.endsWith('/api/inventory-items/by-code/RG_E2E-S01-BL')
        && response.ok())
      await page.goto('/inventory/RG_E2E-S01-BL')
      const restoredAliasItem = await (await restoredAliasResponsePromise).json() as { id: string }
      expect(restoredAliasItem.id).toBe(originalItem.id)
      await expect(page.getByRole('heading', { name: 'RG-S01-BL' })).toBeVisible()
      await expectNoFrameworkOverlay(page)
      await capture(page, testInfo, 'editable-code-restored-alias')
    } catch (error) {
      cleanupError = error
    }
  }

  expect.soft(browserErrors, 'browser console or page errors across rename, views, and restoration').toEqual([])
  if (workflowError) {
    if (cleanupError) expect.soft(cleanupError, 'editable-code cleanup error').toBeUndefined()
    throw workflowError
  }
  if (cleanupError) throw cleanupError
})

test('mobile reviews and cancels a Design Code draft without sending a PATCH', async ({ sharedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only non-mutating editable-code acceptance')
  await login(page)
  const browserErrors: string[] = []
  const designPatchRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && /\/api\/designs\/[0-9a-f-]{36}$/i.test(new URL(request.url()).pathname)) {
      designPatchRequests.push(request.url())
    }
  })

  await page.goto('/designs')
  await expect(page).toHaveTitle('Nritya Alankara Collections')
  await expect(page.getByRole('heading', { name: 'Designs' })).toBeVisible()
  const designRow = page.getByRole('article').filter({ hasText: 'Yellow and Pink' })
  await expect(designRow.locator('strong').first()).toHaveText('YP')
  await designRow.getByRole('link', { name: 'Edit Yellow and Pink' }).click()

  const editor = page.getByRole('dialog', { name: 'Edit design' })
  await expect(editor).toBeVisible()
  await expect(page).toHaveURL(/\/designs\/[0-9a-f-]{36}$/i)
  await expectNoFrameworkOverlay(page)
  const designCode = editor.getByLabel('Design code')
  await expect(designCode).toHaveValue('YP')
  await designCode.fill('YP_MOBILE')
  await expect(designCode).toHaveValue('YP_MOBILE')
  await editor.getByRole('button', { name: 'Save design' }).click()

  const confirmation = page.getByRole('dialog', { name: 'Confirm Design Code change' })
  await expect(confirmation).toBeVisible()
  await expect(confirmation.getByText(codeChangeWarning, { exact: true })).toBeVisible()
  const layout = await confirmation.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return {
      bodyScrollWidth: document.body.scrollWidth,
      dialogClientWidth: element.clientWidth,
      dialogScrollWidth: element.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      left: bounds.left,
      right: bounds.right,
      viewportWidth: window.innerWidth,
    }
  })
  expect(layout.documentScrollWidth).toBeLessThanOrEqual(layout.viewportWidth)
  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.viewportWidth)
  expect(layout.dialogScrollWidth).toBeLessThanOrEqual(layout.dialogClientWidth)
  expect(layout.left).toBeGreaterThanOrEqual(0)
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth)
  await expectNoFrameworkOverlay(page)
  expect(designPatchRequests, 'no Design PATCH before explicit confirmation').toEqual([])
  await capture(page, testInfo, 'mobile-editable-code-confirmation')

  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(editor).toBeVisible()
  await expect(designCode).toHaveValue('YP_MOBILE')
  await expectNoFrameworkOverlay(page)
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page).toHaveURL(/\/designs$/)
  await expect(page.getByRole('article').filter({ hasText: 'Yellow and Pink' }).locator('strong').first()).toHaveText('YP')
  await expectNoFrameworkOverlay(page)
  expect(designPatchRequests, 'canceling keeps the Design Code change draft-only').toEqual([])
  expect(browserErrors, 'browser console or page errors across the mobile draft/cancel flow').toEqual([])
  await capture(page, testInfo, 'mobile-editable-code-cancelled')
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
  await page.getByLabel('Name', { exact: true }).fill('Third Administrator')
  await page.getByLabel('Username').fill('third-local-admin')
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
