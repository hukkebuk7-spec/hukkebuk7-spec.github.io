import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

const routes = [
  { path: '/', name: 'home' },
  { path: '/lab', name: 'lab' },
  { path: '/library', name: 'library' },
  { path: '/about', name: 'about' },
  { path: '/not-a-real-page', name: '404', status: 404 },
]

mkdirSync('/tmp/tempo-shots', { recursive: true })

test.describe('pages', () => {
  for (const route of routes) {
    test(`${route.name} renders without console errors or overflow`, async ({ page }, testInfo) => {
      const errors: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      page.on('pageerror', (error) => errors.push(error.message))

      const response = await page.goto(route.path, { waitUntil: 'networkidle' })
      if (route.status !== 404) expect(response?.status()).toBe(200)

      await expect(page.locator('h1').first()).toBeVisible()
      expect(await page.title()).not.toHaveLength(0)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)

      const suffix = testInfo.project.name
      await page.screenshot({ path: `/tmp/tempo-shots/${route.name}-${suffix}.png`, fullPage: true })
      expect(errors).toEqual([])
    })
  }
})

test('easing lab updates the URL and previews a preset', async ({ page }) => {
  await page.goto('/lab')
  const standard = page.getByRole('button', { name: /Arrive/ })
  await standard.click()
  await expect(page).toHaveURL(/ease=0\.16(%2C|,)1(%2C|,)0\.3(%2C|,)1/)
  await expect(page.locator('.curve-editor')).toBeVisible()
  await page.getByRole('button', { name: /Play preview/ }).click()
  await expect(page.locator('#easing .copy-btn').first()).toBeVisible()
})

test('spring and stagger labs run', async ({ page }) => {
  await page.goto('/lab#spring')
  await page.getByRole('button', { name: /Run spring/ }).click()
  await expect(page.locator('#spring .lab-note').last()).toContainText(/Settled|Reduced/)
  await page.locator('#stagger').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: /Run sequence/ }).click()
  await expect(page.locator('#stagger .lab-note').last()).toContainText(/Running|complete|Reduced/)
})

test('library filters, code toggle, tabs and dialog work', async ({ page }) => {
  await page.goto('/library')
  await page.getByLabel('Search patterns').fill('dialog')
  await expect(page.locator('.pattern-card')).toHaveCount(1)
  await page.getByLabel('Search patterns').fill('')
  await page.getByRole('button', { name: 'Components' }).click()
  await expect(page.locator('.pattern-card').first()).toBeVisible()

  const disclosureCard = page.locator('#disclosure')
  await page.goto('/library#disclosure')
  await expect(disclosureCard).toBeVisible()
  await disclosureCard.getByRole('button', { name: /What counts as motion/ }).click()
  await expect(disclosureCard.getByText(/Duration, easing, choreography/)).toBeVisible()

  await page.locator('#tabs').scrollIntoViewIfNeeded()
  const motionTab = page.getByRole('tab', { name: 'Motion' })
  await motionTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Layout' })).toHaveAttribute('aria-selected', 'true')

  await page.locator('#dialog').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).toBeHidden()

  await page.locator('#fade-rise').scrollIntoViewIfNeeded()
  await page.locator('#fade-rise').getByRole('button', { name: /Show code/ }).click()
  await expect(page.locator('#fade-rise').locator('pre')).toBeVisible()
})

test('mobile menu opens, traps focus, and closes on selection', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile navigation only')
  await page.goto('/')
  const menuButton = page.getByRole('button', { name: 'Menu' })
  await menuButton.click()
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Lab/ }).last()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
})

test('motion switch persists reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Header switch is desktop-only')
  await page.goto('/')
  const toggle = page.getByRole('switch', { name: /Motion/ }).first()
  const initial = await toggle.getAttribute('aria-checked')
  await toggle.click()
  const next = await toggle.getAttribute('aria-checked')
  expect(next).not.toBe(initial)
  await page.reload()
  await expect(page.getByRole('switch', { name: /Motion/ }).first()).toHaveAttribute('aria-checked', next ?? '')
})

test('content is visible with reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const hidden = await page.locator('.reveal--armed:not(.is-in)').count()
  expect(hidden).toBe(0)
})

test('no serious accessibility violations', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route.path, { waitUntil: 'networkidle' })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    if (serious.length) {
      console.log(
        route.path,
        serious.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.target),
        })),
      )
    }
    expect(serious, `${route.path} has serious axe violations`).toEqual([])
  }
})
