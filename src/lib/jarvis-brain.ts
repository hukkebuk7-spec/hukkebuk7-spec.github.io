export type JarvisAction =
  | { label: string; kind: 'navigate'; to: string }
  | { label: string; kind: 'prompt'; prompt: string }
  | { label: string; kind: 'motion'; value: 'reduced' | 'full' }

export type JarvisReply = {
  text: string
  code?: { label: string; code: string }
  actions?: JarvisAction[]
  suggestions?: string[]
}

export type JarvisContext = {
  path: string
  search: string
  reduced: boolean
}

export type QuickPrompt = {
  label: string
  meta: string
  prompt: string
}

type Curve = [number, number, number, number]

const go = (label: string, to: string): JarvisAction => ({ label, kind: 'navigate', to })
const ask = (label: string, prompt: string): JarvisAction => ({ label, kind: 'prompt', prompt })
const setMotion = (label: string, value: 'reduced' | 'full'): JarvisAction => ({
  label,
  kind: 'motion',
  value,
})

const curve = (values: Curve) => `cubic-bezier(${values.join(', ')})`

const numberWords: Record<string, number> = {
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
}

function routeName(path: string) {
  if (path === '/') return 'Index'
  if (path.startsWith('/lab')) return 'Lab'
  if (path.startsWith('/library')) return 'Library'
  if (path.startsWith('/about')) return 'About'
  return 'Not found'
}

function currentCurve(context: JarvisContext) {
  const params = new URLSearchParams(context.search)
  const raw = params.get('ease')
  const duration = params.get('d')
  if (!raw) return null
  const values = raw.split(',').map(Number)
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null
  return {
    curve: curve(values as Curve),
    duration: duration && Number.isFinite(Number(duration)) ? Number(duration) : null,
  }
}

function replyForPage(context: JarvisContext): JarvisReply {
  const route = routeName(context.path)
  const motion = context.reduced ? 'reduced' : 'full'
  const tuned = currentCurve(context)

  if (route === 'Lab') {
    return {
      text: tuned
        ? `You are in the Lab with ${tuned.curve} in the URL${tuned.duration ? ` at ${tuned.duration} ms` : ''}. The URL is the source of truth here, so the link you share is the exact motion you tuned.\n\nAsk me to explain that curve, compare it with a spring, or audit the rest of the page around it.`
        : 'You are in the Lab. The easing editor, spring simulator, and stagger composer all run locally. Drag a control point, feel the result at a realistic duration, then copy the CSS or JS.\n\nIf you want a second opinion, tell me the component you are moving and I will give you a starting duration and curve.',
      actions: [
        ask('Explain this curve', 'Explain the curve I am tuning'),
        go('Open the spring lab', '/lab#spring'),
        ask('Audit this page', 'Audit the motion on this page'),
      ],
      suggestions: [
        'What easing suits an exit?',
        'What spring feels snappy?',
        'How long should a page transition take?',
      ],
    }
  }

  if (route === 'Library') {
    return {
      text: 'You are in the pattern library: twelve working patterns with live demos, keyboard behaviour, reduced-motion fallbacks, and code you can lift. Search by component, then open the code toggle inside a card.\n\nTell me the component you are building and I will point you to the closest pattern.',
      actions: [
        ask('Find a dialog pattern', 'Which pattern should I use for a dialog?'),
        ask('Find a toast pattern', 'Which pattern should I use for a toast?'),
        go('Open the lab', '/lab'),
      ],
      suggestions: [
        'Which pattern handles a modal?',
        'How do I animate a list of cards?',
        'Which patterns respect reduced motion?',
      ],
    }
  }

  if (route === 'About') {
    return {
      text: 'You are reading the method: the case for motion as a design material, the accessibility floor, the colophon, and the sources. The motion ruler on this page maps common jobs to honest time budgets.\n\nAsk me about any recommendation here and I will turn it into a concrete starting point.',
      actions: [
        go('Read the references', '/about#refs-title'),
        ask('Explain reduced motion', 'Explain reduced motion like I am new to it'),
        ask('Audit this page', 'Audit the motion on this page'),
      ],
      suggestions: [
        'What is the motion budget?',
        'How do I test on a phone?',
        'What does reduced motion change here?',
      ],
    }
  }

  if (route === 'Not found') {
    return {
      text: 'That path is off the timeline, but nothing is broken. The guide still has the index, the Lab, the pattern library, and the method. Tell me what you were looking for and I will point you to the nearest page.',
      actions: [go('Back to the index', '/'), go('Open the lab', '/lab')],
    }
  }

  return {
    text: `You are on the index with motion ${motion}. The first screen sets up the premise: motion is a language, and every animation should explain a change. From here you can enter the Lab, browse the patterns, or run the eight-point motion budget.\n\nI can also audit what is currently running on this page if you want a live reading.`,
    actions: [
      go('Enter the lab', '/lab'),
      go('Browse patterns', '/library'),
      ask('Run an audit', 'Audit the motion on this page'),
    ],
    suggestions: [
      'What should I learn first?',
      'How do I audit my motion?',
      'Show me a reduced-motion fallback',
    ],
  }
}

function replyForEasing(lower: string, context: JarvisContext): JarvisReply {
  const leaving = /\b(exit|leave|close|dismiss|out|outro)\b/.test(lower)
  let job = 'a panel'
  let duration = 280
  let values: Curve = [0.16, 1, 0.3, 1]

  if (/\b(button|hover|press|toggle|switch|tap)\b/.test(lower)) {
    job = 'a press or toggle'
    duration = 120
    values = [0.2, 0, 0, 1]
  } else if (/\b(dialog|modal|drawer|sheet|popover|menu|tooltip)\b/.test(lower)) {
    job = 'a small overlay'
    duration = 220
  } else if (/\b(toast|notification|banner)\b/.test(lower)) {
    job = 'a toast'
    duration = 240
  } else if (/\b(page|route|view|screen)\b/.test(lower)) {
    job = 'a page or view change'
    duration = 420
    values = [0.65, 0, 0.35, 1]
  } else if (/\b(card|list|grid|item|row)\b/.test(lower)) {
    job = 'a component transition'
    duration = 300
  }

  if (leaving) {
    duration = Math.max(100, Math.round(duration * 0.8))
    values = [0.7, 0, 0.84, 0]
  }

  const tuned = currentCurve(context)
  const contextNote = tuned ? `\n\nThe curve currently in your URL is ${tuned.curve}${tuned.duration ? ` at ${tuned.duration} ms` : ''}.` : ''
  const code = `.panel {
  opacity: 0;
  transform: translateY(${job === 'a page or view change' ? '12px' : '8px'});
  transition:
    opacity ${duration}ms ${curve(values)},
    transform ${duration}ms ${curve(values)};
}

.panel.is-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
    opacity: 1;
    transform: none;
  }
}`

  return {
    text: `For ${job}, start around ${duration} ms with ${curve(values)}. That curve leaves quickly and lands softly, which reads as responsive rather than slow.${leaving ? ' Exits should be shorter than entrances; do not make people wait for something to leave.' : ''}${contextNote}\n\nThe curve is only half the decision. Check it at the duration you will ship, on a phone, and with reduced motion enabled. If the motion adds no meaning, remove it.`,
    code: { label: `CSS / ${job}`, code },
    actions: [
      go('Tune it in the lab', `/lab?ease=${values.join(',')}&d=${duration}#easing`),
      ask('Compare with a spring', `What spring would suit ${job}?`),
      ask('Audit this page', 'Audit the motion on this page'),
    ],
    suggestions: [
      'What easing should an exit use?',
      'How long should a modal take?',
      'Show me a spring alternative',
    ],
  }
}

function replyForSpring(lower: string): JarvisReply {
  const bouncy = /\b(bounce|bouncy|playful|elastic|overshoot)\b/.test(lower)
  const heavy = /\b(heavy|slow|weight|large|sheet|drawer)\b/.test(lower)
  const stiffness = bouncy ? 220 : heavy ? 110 : 260
  const damping = bouncy ? 12 : heavy ? 18 : 24
  const mass = heavy ? 1.8 : 1
  const duration = bouncy ? 640 : heavy ? 720 : 420
  const code = `.sheet {
  transition:
    transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    transition: none;
  }
}`

  return {
    text: `Start with stiffness ${stiffness}, damping ${damping}, and mass ${mass}${bouncy ? ' — low damping is what creates the overshoot, so use it only when the bounce communicates energy' : ''}. Stiffness sets the speed, damping controls how quickly the overshoot disappears, and mass makes the same motion feel heavier.\n\nFor production CSS, a sampled linear() curve is more faithful than a cubic-bezier approximation. Open the spring lab, tune the three values, then copy the generated curve. The cubic-bezier below is a safe bounce-flavoured fallback, not a simulation.`,
    code: { label: 'CSS / spring fallback', code },
    actions: [
      go('Open the spring lab', '/lab#spring'),
      ask('Compare with easing', 'What easing is closest to a spring?'),
      ask('Audit this page', 'Audit the motion on this page'),
    ],
    suggestions: [
      'What damping stops the bounce?',
      'How do I export a linear() curve?',
      'What spring suits a bottom sheet?',
    ],
  }
}

function staggerCount(lower: string) {
  const numeric = lower.match(/\b(\d{1,2})\b/)
  if (numeric) return Math.min(16, Math.max(2, Number(numeric[1])))
  for (const [word, value] of Object.entries(numberWords)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) return value
  }
  return 6
}

function replyForStagger(lower: string): JarvisReply {
  const count = staggerCount(lower)
  const gap = count > 8 ? 45 : count > 5 ? 60 : 70
  const duration = 480
  const total = gap * (count - 1)
  const code = `gsap.from('.card', {
  y: 24,
  opacity: 0,
  duration: 0.48,
  ease: 'power3.out',
  stagger: ${(gap / 1000).toFixed(2)},
});

/* Respect the user's motion preference. */
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.set('.card', { clearProps: 'all' });
}`

  return {
    text: `For ${count} items, use a ${gap} ms gap with a 480 ms entrance. The last item starts at ${total} ms and settles around ${total + duration} ms. That${total + duration > 900 ? ' is at the long end; cut the gap if the group grows' : ' stays inside a comfortable group budget'}.\n\nStagger is choreography, not a default. Keep the direction consistent, cap the total sequence, and never make someone wait for the last card before they can read the first. If the list is long, animate only the visible group.`,
    code: { label: 'JS / GSAP stagger', code },
    actions: [
      go('Open the stagger lab', '/lab#stagger'),
      ask('Make it faster', `Plan a ${count}-item stagger with a shorter gap`),
      ask('Check accessibility', 'How do I make stagger accessible?'),
    ],
    suggestions: [
      'How many items should I stagger?',
      'Should exits stagger too?',
      'What about reduced motion?',
    ],
  }
}

function replyForReduced(context: JarvisContext): JarvisReply {
  const code = `.card {
  transition:
    opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition-duration: 0.01ms;
    transform: none;
  }
}

/* Keep the state change. Remove the travel. */`

  return {
    text: `Reduced motion is a design state, not a broken version of the page. Keep the feedback that explains what changed — opacity, colour, an instant position change — and remove the travel that can cause discomfort.\n\nThe floor is simple: nothing may stay hidden behind an entrance animation, infinite loops must stop, and scroll-driven effects must not trap the page. Test with the operating-system setting, not only the site switch.${context.reduced ? '\n\nMotion is currently reduced on this device. The page should still resolve every state to its final position.' : '\n\nMotion is currently on. I can turn it off here so you can inspect the reduced path immediately.'}`,
    code: { label: 'CSS / reduced-motion floor', code },
    actions: [
      setMotion(context.reduced ? 'Turn motion on' : 'Turn motion off', context.reduced ? 'full' : 'reduced'),
      go('Read the access section', '/about#access-title'),
      ask('Audit this page', 'Audit the motion on this page'),
    ],
    suggestions: [
      'What should stay animated?',
      'How do I test the OS setting?',
      'What is vestibular safety?',
    ],
  }
}

function replyForAccessibility(context: JarvisContext): JarvisReply {
  return {
    text: `Accessible motion starts with three questions: Can the same meaning be understood without the movement? Can every control be reached from the keyboard? Does the page remain readable and stable while it moves?\n\nThen cover the floor: visible focus, semantic controls, announced status changes, no hover-only information, and a reduced-motion path. Automated checks help, but they will not catch a focus loss or a pointless 900 ms reveal.\n\n${context.reduced ? 'Reduced motion is on right now, so this is a useful moment to tab through the page and check that every state still makes sense.' : 'Turn reduced motion on and repeat your main journey. That is the fastest way to find motion that is carrying meaning it should not.'}`,
    actions: [
      setMotion(context.reduced ? 'Turn motion on' : 'Turn motion off', context.reduced ? 'full' : 'reduced'),
      go('Read the access section', '/about#access-title'),
      ask('Check a dialog', 'How should a dialog handle focus?'),
    ],
    suggestions: [
      'What are the WCAG rules for motion?',
      'How do I announce a toast?',
      'Should I support keyboard shortcuts?',
    ],
  }
}

const patterns = [
  {
    test: /\b(dialog|modal|popover|drawer|sheet)\b/,
    id: 'dialog',
    title: 'Dialog that returns focus',
    note: 'A native dialog with a real focus return, Escape handling, and a reduced-motion path. Use it for decisions that genuinely need interruption.',
  },
  {
    test: /\b(toast|notification|snackbar)\b/,
    id: 'toast',
    title: 'Toast with a way out',
    note: 'A polite status message that announces itself, dismisses itself, and can always be closed by hand.',
  },
  {
    test: /\b(tab|tablist|segmented)\b/,
    id: 'tabs',
    title: 'Tabs with a sliding indicator',
    note: 'Arrow-key navigation, roving tabindex, and a moving indicator that never becomes the only signal.',
  },
  {
    test: /\b(skeleton|loading|shimmer)\b/,
    id: 'skeleton',
    title: 'Skeleton with reserved space',
    note: 'A loading state that occupies the final footprint, so the content does not jump when it arrives.',
  },
  {
    test: /\b(magnetic|cursor|pointer)\b/,
    id: 'magnetic-button',
    title: 'Magnetic button',
    note: 'A restrained pointer-follow effect that is disabled for touch and reduced motion, and never replaces button behaviour.',
  },
  {
    test: /\b(parallax|scroll|depth)\b/,
    id: 'parallax',
    title: 'Parallax without the jank',
    note: 'A scroll-linked depth effect built to avoid layout work, with a static fallback and no scroll-jacking.',
  },
  {
    test: /\b(counter|count|number|stat)\b/,
    id: 'count-up',
    title: 'Count up',
    note: 'A short, honest number reveal. Format with the user locale, label synthetic data, and skip the theatre for reduced motion.',
  },
  {
    test: /\b(before|after|compare|comparison|slider)\b/,
    id: 'before-after',
    title: 'Before / after split',
    note: 'A draggable comparison with a keyboard path, so the interaction is not pointer-only.',
  },
  {
    test: /\b(disclosure|accordion|expand|collapse)\b/,
    id: 'disclosure',
    title: 'Disclosure',
    note: 'A native-feeling expander with real aria-expanded state and a grid-based height transition.',
  },
  {
    test: /\b(mask|headline|title|reveal)\b/,
    id: 'mask-reveal',
    title: 'Masked headline',
    note: 'Type revealed through an overflow mask, with the semantic text left intact.',
  },
  {
    test: /\b(fade|rise|entrance|enter)\b/,
    id: 'fade-rise',
    title: 'Fade & rise',
    note: 'The dependable entrance: a short vertical move, opacity, and a curve that settles rather than stops.',
  },
  {
    test: /\b(underline|nav|link|menu)\b/,
    id: 'underline-nav',
    title: 'Underline that follows',
    note: 'A focusable, hoverable navigation rule. State stays visible without relying on colour alone.',
  },
] as const

function replyForPattern(lower: string): JarvisReply | null {
  const match = patterns.find((pattern) => pattern.test.test(lower))
  if (!match) return null
  return {
    text: `The closest pattern is “${match.title}”. ${match.note}\n\nOpen the card in the library for the live demo, keyboard behaviour, and code. If you tell me the exact context — for example, a destructive confirmation or a mobile drawer — I can narrow the timing and motion.`,
    actions: [
      go('Open the pattern', `/library#${match.id}`),
      ask('How long should it take?', `What duration and easing should ${match.title} use?`),
      ask('Check accessibility', 'What should I check for keyboard and reduced motion?'),
    ],
    suggestions: [
      'Show me the code',
      'What is the reduced-motion fallback?',
      'Which pattern is closest for a toast?',
    ],
  }
}

function replyForPerformance(): JarvisReply {
  return {
    text: `Motion gets expensive when it triggers layout. Prefer transform and opacity; measure before adding will-change; keep scroll handlers on requestAnimationFrame and only while the element is visible.\n\nWatch for four specific failures: a long task on the first interaction, layout shift when media loads, an animation that keeps running off-screen, and a 60 fps demo that drops to 20 fps on a mid-range phone. Test the last one on a real phone or with the CPU throttled.`,
    actions: [
      ask('Audit this page', 'Audit the motion on this page'),
      go('Read the motion budget', '/#budget'),
      go('Open the lab', '/lab'),
    ],
    suggestions: [
      'Is will-change safe?',
      'How do I stop off-screen loops?',
      'What causes layout shift?',
    ],
  }
}

function replyForPageTransitions(): JarvisReply {
  return {
    text: `A page change has one job: preserve context. Keep it between 320 and 520 ms, avoid blocking navigation, and do not replay the full entrance choreography on every route. The user already knows where they were.\n\nThe View Transitions API can help where it is supported, but the same rule applies: a short crossfade or a clipped wipe is enough. Always provide the instant path when reduced motion is requested.`,
    code: {
      label: 'CSS / a short route change',
      code: `@keyframes route-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

.route {
  animation: route-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .route { animation: none; }
}`,
    },
    actions: [
      go('See the route treatment', '/about'),
      ask('Audit this page', 'Audit the motion on this page'),
    ],
    suggestions: [
      'Should I use View Transitions?',
      'How long should a route change take?',
      'What about back navigation?',
    ],
  }
}

function replyForBudget(): JarvisReply {
  return {
    text: `The motion budget is eight questions to run before shipping:\n\n- Every animation has a named purpose: orient, explain, or confirm.\n- Duration matches distance. Short hops stay under 200 ms.\n- Exits are quicker than entrances.\n- Spatial movement is eased, never linear.\n- A reduced-motion path exists and keeps the meaning.\n- Decorative loops pause off-screen or on request.\n- It is tested on a mid-range phone, not only a laptop.\n- No layout shift, no scroll-jacking, no keyboard traps.\n\nThe list is deliberately short. If you cannot answer a question with evidence, that is the item to fix next.`,
    actions: [
      go('Open the motion budget', '/#budget'),
      ask('Audit this page', 'Audit the motion on this page'),
    ],
    suggestions: ['How do I test on a mid-range phone?', 'What counts as a keyboard trap?', 'How do I name a purpose?'],
  }
}

function replyForGrok(): JarvisReply {
  return {
    text: `I am not a Grok clone, and I am not going to pretend to be one. The useful part of that kind of interface is simple: one place to ask, a short memory, and visible actions instead of dead ends. That is the part worth borrowing.\n\nI keep the interaction native to TEMPO — paper, ink, signal, a transcript rather than a novelty skin — and I run locally in this browser. No cloud model, no account, and no transcript leaving the page. Ask me about motion and I will give you a concrete starting point.`,
    actions: [
      ask('Explain easing', 'Explain easing in plain English'),
      ask('Audit this page', 'Audit the motion on this page'),
      ask('What can you do?', 'What can you do?'),
    ],
  }
}

function replyForHelp(): JarvisReply {
  return {
    text: `I am Jarvis, the local motion pilot for TEMPO. I can:\n\n- Explain easing, springs, stagger, reduced motion, and performance in plain language.\n- Recommend a duration and curve for a specific component.\n- Audit the computed motion on the page you are viewing.\n- Take you to the exact lab, pattern, or budget section.\n\nI am strongest on motion. If you ask something far outside that, I will say so rather than invent an answer.`,
    actions: [
      ask('Tune a dialog', 'What easing should I use for a dialog entrance?'),
      ask('Build a stagger', 'Build a stagger sequence for eight cards'),
      ask('Audit this page', 'Audit the motion on this page'),
      go('Open the library', '/library'),
    ],
    suggestions: [
      'What can you do?',
      'How do I export a spring?',
      'What should I learn first?',
    ],
  }
}

function replyForInsult(lower: string): JarvisReply | null {
  if (!/\b(fuck|shit|bitch|asshole)\b/.test(lower)) return null
  return {
    text: 'I can take it. I am still here, and I am still useful. Tell me what you want to tune and I will get specific.',
    actions: [
      ask('Tune an entrance', 'What easing should I use for a dialog entrance?'),
      ask('Audit this page', 'Audit the motion on this page'),
    ],
  }
}

function parseTimes(value: string) {
  return value.split(',').map((part) => {
    const trimmed = part.trim()
    if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed)
    if (trimmed.endsWith('s')) return Number.parseFloat(trimmed) * 1000
    return 0
  })
}

function auditPage(context: JarvisContext): JarvisReply {
  if (typeof document === 'undefined') {
    return { text: 'I can only audit a live page in the browser.' }
  }

  const root = document.getElementById('main') ?? document.body
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*')).slice(0, 3000)]
  let transitions = 0
  let animations = 0
  let infinite = 0
  let longest = 0

  for (const node of nodes) {
    const style = window.getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    const transitionTimes = parseTimes(style.transitionDuration)
    const animationTimes = parseTimes(style.animationDuration)
    if (style.transitionProperty !== 'none' && transitionTimes.some((time) => time > 0.5)) {
      transitions += 1
    }
    if (style.animationName !== 'none' && animationTimes.some((time) => time > 0.5)) {
      animations += 1
    }
    if (style.animationName !== 'none' && style.animationIterationCount.includes('infinite')) {
      infinite += 1
    }
    longest = Math.max(longest, ...transitionTimes, ...animationTimes)
  }

  const interactive = root.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  ).length

  const findings: string[] = []
  if (infinite > 0) {
    findings.push(
      `${infinite} looping animation${infinite === 1 ? '' : 's'} registered. Confirm each one stops for reduced motion and when off-screen.`,
    )
  }
  if (longest > 800) {
    findings.push(
      `The longest timing is ${Math.round(longest)} ms. That can be right for a rare transition, but check that it never delays access to content.`,
    )
  }
  if (context.reduced) {
    findings.push('Reduced motion is on. Confirm every state still resolves to its final position.')
  } else {
    findings.push('Reduced motion is off. Toggle it and repeat the main journey before shipping.')
  }
  if (interactive > 0) {
    findings.push(`${interactive} interactive target${interactive === 1 ? '' : 's'} found. Tab through the page once, without a mouse.`)
  }

  const verdict = context.reduced
    ? 'The reduced path is active; the useful next check is whether anything remains hidden or ambiguous.'
    : infinite > 0
      ? 'Worth a second pass: infinite motion is the most common source of accidental discomfort.'
      : 'No obvious red flags in the live surface scan. That is a starting point, not a clean bill of health.'

  return {
    text: `I scanned the rendered page, not the source. Counts come from computed styles at rest, so they include transitions that are defined but not currently playing.\n\n- Transitions defined: ${transitions}\n- Animations defined: ${animations}${infinite ? ` (${infinite} infinite)` : ''}\n- Longest timing: ${Math.round(longest)} ms\n- Interactive targets: ${interactive}\n\n${findings.map((finding) => `- ${finding}`).join('\n')}\n\n${verdict}`,
    actions: [
      ask('Audit again', 'Audit the motion on this page again'),
      go('Open the motion budget', '/#budget'),
      setMotion(context.reduced ? 'Turn motion on' : 'Turn motion off', context.reduced ? 'full' : 'reduced'),
    ],
    suggestions: [
      'What should I fix first?',
      'How do I test reduced motion?',
      'What is the motion budget?',
    ],
  }
}

export function quickPrompts(context: JarvisContext): QuickPrompt[] {
  if (context.path.startsWith('/lab')) {
    return [
      { label: 'Explain this curve', meta: 'timing + intent', prompt: 'Explain the curve I am tuning' },
      { label: 'Find the spring preset', meta: 'weight + bounce', prompt: 'What spring feels snappy?' },
      { label: 'Audit this page', meta: 'live computed styles', prompt: 'Audit the motion on this page' },
      { label: 'Compare entrances and exits', meta: 'duration + direction', prompt: 'Compare entrance and exit motion' },
    ]
  }
  if (context.path.startsWith('/library')) {
    return [
      { label: 'Pick a dialog pattern', meta: 'focus + escape', prompt: 'Which pattern should I use for a dialog?' },
      { label: 'Animate a list', meta: 'stagger + budget', prompt: 'How do I animate a list of cards?' },
      { label: 'Audit this page', meta: 'live computed styles', prompt: 'Audit the motion on this page' },
      { label: 'Check accessibility', meta: 'keyboard + reduced', prompt: 'What should I check for accessibility?' },
    ]
  }
  if (context.path.startsWith('/about')) {
    return [
      { label: 'Explain reduced motion', meta: 'the design floor', prompt: 'Explain reduced motion like I am new to it' },
      { label: 'Open the motion budget', meta: 'eight checks', prompt: 'What is the motion budget?' },
      { label: 'Audit this page', meta: 'live computed styles', prompt: 'Audit the motion on this page' },
      { label: 'Test on a phone', meta: 'real devices', prompt: 'How do I test motion on a phone?' },
    ]
  }
  return [
    { label: 'Tune a dialog entrance', meta: 'curve + duration', prompt: 'What easing should I use for a dialog entrance?' },
    { label: 'Explain springs', meta: 'stiffness + damping', prompt: 'Explain springs like I am new to them' },
    { label: 'Build a stagger', meta: 'choreography', prompt: 'Build a stagger sequence for eight cards' },
    { label: 'Audit this page', meta: 'live computed styles', prompt: 'Audit the motion on this page' },
  ]
}

export function buildReply(input: string, context: JarvisContext): JarvisReply {
  const lower = input.trim().toLowerCase()
  const insult = replyForInsult(lower)
  if (insult) return insult

  if (!lower) return replyForHelp()

  if (/^(hi|hello|hey|yo|good morning|good evening|good afternoon)\b/.test(lower)) {
    return {
      text: 'Hello. What are we tuning? I can explain a timing decision, draft a stagger, audit this page, or take you straight to the lab.',
      actions: [
        ask('Audit this page', 'Audit the motion on this page'),
        go('Open the lab', '/lab'),
        ask('What can you do?', 'What can you do?'),
      ],
      suggestions: quickPrompts(context).slice(0, 3).map((prompt) => prompt.prompt),
    }
  }

  if (/\b(grok|xai|chatbot|clone|reverse engineer)\b/.test(lower)) return replyForGrok()

  if (
    /\b(audit|scan this page|review this page|review my motion|inspect this page|check this page)\b/.test(lower)
  ) {
    return auditPage(context)
  }

  if (/\b(motion budget|budget checklist|eight.point|shipping checklist)\b/.test(lower)) {
    return replyForBudget()
  }

  if (/\b(reduced motion|reduce motion|motion sickness|vestibular|less motion|turn off motion)\b/.test(lower)) {
    return replyForReduced(context)
  }

  if (/\b(wcag|a11y|accessib|keyboard|focus|screen reader|contrast|aria)\b/.test(lower)) {
    return replyForAccessibility(context)
  }

  if (/\b(this page|where am i|what am i looking at|what is here|current page|context)\b/.test(lower)) {
    return replyForPage(context)
  }

  if (/\b(spring|bounce|elastic|stiffness|damping|overshoot|mass)\b/.test(lower)) {
    return replyForSpring(lower)
  }

  if (/\b(stagger|choreograph|sequence|list of cards|group of|items)\b/.test(lower)) {
    return replyForStagger(lower)
  }

  if (/\b(page transition|route transition|view transition|between pages|navigate)\b/.test(lower)) {
    return replyForPageTransitions()
  }

  if (/\b(performance|jank|fps|frame rate|smooth|lag|layout shift|will-change)\b/.test(lower)) {
    return replyForPerformance()
  }

  if (/\b(ease|easing|curve|bezier|cubic|duration|timing|transition|animate|animation)\b/.test(lower)) {
    return replyForEasing(lower, context)
  }

  if (/\b(pattern|library|component|demo)\b/.test(lower)) {
    return replyForPattern(lower) ?? {
      text: 'The library has twelve patterns across entrances, interactions, components, feedback, data, media, and scroll. Tell me the component you are building — a dialog, toast, tab set, skeleton, counter, or something else — and I will point you to the closest one.',
      actions: [go('Browse the library', '/library')],
    }
  }

  const pattern = replyForPattern(lower)
  if (pattern) return pattern

  if (/\b(help|what can you do|capabilities|who are you|what are you)\b/.test(lower)) {
    return replyForHelp()
  }

  if (/\b(phone|device|mobile|test)\b/.test(lower)) {
    return {
      text: 'Test motion on the device your audience actually uses. A desktop browser with the CPU throttled is useful, but it will not reproduce touch latency, thermal throttling, or a mid-range GPU.\n\nThe practical loop: repeat the main journey at 320 px wide, watch for dropped frames during the first interaction, turn on reduced motion, then navigate with the keyboard. If the experience still explains itself, the motion is earning its place.',
      actions: [ask('Open the motion budget', 'What is the motion budget?'), go('Open the lab', '/lab')],
      suggestions: ['How do I test reduced motion?', 'What causes jank?', 'Show me a mobile pattern'],
    }
  }

  if (/\b(thanks|thank you|nice|good|great)\b/.test(lower)) {
    return {
      text: 'Any time. If you want a second opinion on a specific component, give me the job it has to do and the duration you are considering.',
      actions: [ask('Audit this page', 'Audit the motion on this page'), go('Open the lab', '/lab')],
    }
  }

  return {
    text: `I did not catch a motion job in that. I am strongest on easing, springs, stagger, reduced motion, performance, and the patterns in this guide.\n\nTry naming the component and the job it has to do — for example, “a dialog entrance that should feel instant” or “a six-card stagger that does not feel slow”.`,
    actions: [
      ...quickPrompts(context).slice(0, 3).map((prompt) => ask(prompt.label, prompt.prompt)),
      go('Open the pattern library', '/library'),
    ],
    suggestions: ['What can you do?', 'Explain easing in plain English', 'Audit this page'],
  }
}
