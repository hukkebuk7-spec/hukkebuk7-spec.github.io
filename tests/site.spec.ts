import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

async function settleEntranceAnimations(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    for (const animation of document.getAnimations()) {
      try {
        const timing = animation.effect?.getComputedTiming()
        if (timing && timing.iterations !== Infinity) animation.finish()
      } catch {
        /* Finite check can race with an animation that just ended. */
      }
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
}

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

test('lab deep links keep the hash while syncing params', async ({ page }) => {
  await page.goto('/lab#spring')
  await expect(page).toHaveURL(/ease=.+#spring$/, { timeout: 5000 })
  await expect(page.locator('#spring h2')).toBeInViewport()
})

test('spring and stagger labs run', async ({ page }) => {
  await page.goto('/lab#spring')
  const runSpring = page.getByRole('button', { name: /Run spring/ })
  await runSpring.scrollIntoViewIfNeeded()
  await runSpring.click()
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

test('motion layer keeps headings and the register usable', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'networkidle' })
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toHaveClass(/split-heading/)
  await expect(heading).toContainText(/A field guide/)
  expect(await heading.locator('.split-word').count()).toBeGreaterThan(2)

  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('.reel-card')).toHaveCount(12)
  await expect(page.locator('.reel')).toHaveAttribute('data-active', 'true')
})

test('motion ruler is present and readable on about', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'networkidle' })
  const ruler = page.locator('.motion-ruler')
  await ruler.scrollIntoViewIfNeeded()
  await expect(ruler).toBeVisible()
  await expect(ruler.getByRole('img')).toHaveAttribute(
    'aria-labelledby',
    'ruler-title ruler-desc',
  )
})

test('masked section content reveals when scrolled into view', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'networkidle' })
  const step = page.locator('.about-step').first()
  await step.scrollIntoViewIfNeeded()
  await expect(step).toHaveClass(/is-in/)
  await expect(step).toHaveCSS('opacity', '1')

  await page.goto('/lab', { waitUntil: 'networkidle' })
  const springHead = page.locator('#spring .lab-section__head')
  await springHead.scrollIntoViewIfNeeded()
  await expect(springHead).toHaveClass(/is-in/)
  await expect(page.locator('#spring h2')).toContainText(/physical/)
})

test('navigation mounts the route wipe and updates the page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.body.dataset.sawWipe = 'false'
    const observer = new MutationObserver(() => {
      if (document.querySelector('.route-wipe')) {
        document.body.dataset.sawWipe = 'true'
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
  await page.getByRole('link', { name: 'Pattern library', exact: true }).click()
  await expect(page).toHaveURL(/\/library$/)
  await expect(page.locator('body')).toHaveAttribute('data-saw-wipe', 'true')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Twelve patterns/)
})

test('reduced motion swaps the register to a static grid and skips 3D', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('.reel')).toHaveAttribute('data-active', 'false')
  await expect(page.locator('.reel-card').first()).toBeVisible()
  await expect(page.locator('.signal3d')).toHaveCount(0)
})

test('home has no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/', { waitUntil: 'networkidle' })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test.describe('jarvis', () => {
  test('opens from the header, keeps focus inside, and closes on Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Header trigger is desktop-only')
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Jarvis', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: /Jarvis/ })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('textbox', { name: /Ask Jarvis/ })).toBeFocused()

    for (let index = 0; index < 45; index += 1) await page.keyboard.press('Tab')
    const focusInside = await page.evaluate(
      () => document.querySelector('.jarvis')?.contains(document.activeElement) ?? false,
    )
    expect(focusInside).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('wake word opens Jarvis and sends the spoken command', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Header trigger is desktop-only')
    await page.addInitScript(() => {
      type MockRecognitionLike = {
        lang: string
        continuous: boolean
        interimResults: boolean
        onstart: (() => void) | null
        onend: (() => void) | null
        onresult: ((event: unknown) => void) | null
        onerror: ((event: unknown) => void) | null
        start: () => void
        stop: () => void
        abort: () => void
        emit: (text: string) => void
      }
      const scope = window as unknown as {
        SpeechRecognition: new () => MockRecognitionLike
        __wakeRec: MockRecognitionLike
      }
      class MockRecognition implements MockRecognitionLike {
        lang = ''
        continuous = false
        interimResults = false
        onstart: (() => void) | null = null
        onend: (() => void) | null = null
        onresult: ((event: unknown) => void) | null = null
        onerror: ((event: unknown) => void) | null = null
        constructor() {
          scope.__wakeRec = this
        }
        start() {
          window.setTimeout(() => this.onstart?.(), 0)
        }
        stop() {
          window.setTimeout(() => this.onend?.(), 0)
        }
        abort() {
          window.setTimeout(() => this.onend?.(), 0)
        }
        emit(text: string) {
          const result = { 0: { transcript: text }, isFinal: true, length: 1 }
          this.onresult?.({ resultIndex: 0, results: { 0: result, length: 1 } })
        }
      }
      scope.SpeechRecognition = MockRecognition
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Jarvis', exact: true }).click()
    const wakeSwitch = page.getByRole('switch', { name: /Wake word/ })
    await wakeSwitch.click()
    await expect(wakeSwitch).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('Escape')

    await expect(page.locator('.wakeword')).toContainText(/Listening for/)
    await page.evaluate(() => {
      const scope = window as unknown as { __wakeRec: { emit: (text: string) => void } }
      scope.__wakeRec.emit('Jarvis what easing should I use for a dialog entrance')
    })

    const dialog = page.getByRole('dialog', { name: /Jarvis/ })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.jarvis-msg--user')).toContainText(
      /what easing should I use for a dialog entrance/i,
    )
    await expect(dialog.locator('.jarvis-msg--assistant').first()).toBeVisible({ timeout: 6000 })
  })

  test('answers a tuning prompt and changes the motion preference', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Header trigger is desktop-only')
    await page.goto('/')
    await page.getByRole('button', { name: 'Jarvis', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: /Jarvis/ })
    await dialog.getByRole('button', { name: /Tune a dialog entrance/ }).click()

    const firstReply = dialog.locator('.jarvis-msg--assistant').first()
    await expect(firstReply).toBeVisible({ timeout: 6000 })
    await expect(firstReply).toContainText(/small overlay/i)
    await expect(firstReply.locator('.jarvis-code code')).toContainText('cubic-bezier')
    await expect(firstReply.locator('.jarvis-code code')).toContainText('220ms')

    await firstReply.getByRole('button', { name: /Audit this page/ }).click()
    const auditReply = dialog.locator('.jarvis-msg--assistant').last()
    await expect(auditReply).toContainText(/scanned the rendered page/i, { timeout: 6000 })
    await auditReply.getByRole('button', { name: /Turn motion off/ }).click()
    await expect(auditReply).toContainText(/Motion is off/)
    await expect(dialog.locator('.jarvis__context dd').filter({ hasText: 'Reduced' })).toBeVisible()
  })

  test('has no serious accessibility violations while open', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Header trigger is desktop-only')
    await page.goto('/')
    await page.getByRole('button', { name: 'Jarvis', exact: true }).click()
    await settleEntranceAnimations(page)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    if (serious.length) {
      console.log(
        'jarvis',
        serious.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.target),
        })),
      )
    }
    expect(serious, 'Jarvis has serious axe violations').toEqual([])
  })
})

test('no serious accessibility violations', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route.path, { waitUntil: 'networkidle' })
    // Finish finite entrance animations so axe evaluates final colours.
    await settleEntranceAnimations(page)
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
