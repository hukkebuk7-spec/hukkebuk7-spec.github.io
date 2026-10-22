import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { CodeSample } from '../components/CodeSample'
import { Icon } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import {
  CompareDemo,
  CounterDemo,
  DialogDemo,
  DisclosureDemo,
  FadeRiseDemo,
  MagneticDemo,
  MaskRevealDemo,
  ParallaxDemo,
  SkeletonDemo,
  TabsDemo,
  ToastDemo,
  UnderlineNavDemo,
} from '../features/PatternDemos'

const categories = ['All', 'Entrance', 'Interaction', 'Components', 'Feedback', 'Data', 'Media', 'Scroll'] as const
type Category = (typeof categories)[number]

type Pattern = {
  id: string
  number: string
  title: string
  category: Exclude<Category, 'All'>
  tech: string
  summary: string
  code: string
  Demo: () => React.JSX.Element
}

const patterns: Pattern[] = [
  {
    id: 'fade-rise',
    number: '01',
    title: 'Fade & rise',
    category: 'Entrance',
    tech: 'CSS',
    summary: 'The dependable entrance. A short vertical move plus opacity, with a curve that settles rather than stops.',
    code: `.card {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 480ms cubic-bezier(.16, 1, .3, 1),
    transform 480ms cubic-bezier(.16, 1, .3, 1);
}

.card.is-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
    opacity: 1;
    transform: none;
  }
}`,
    Demo: FadeRiseDemo,
  },
  {
    id: 'mask-reveal',
    number: '02',
    title: 'Masked headline',
    category: 'Entrance',
    tech: 'CSS',
    summary: 'Reveal type by moving it out of an overflow mask. Keep the semantic text intact and stagger lines with a custom property.',
    code: `.line {
  display: block;
  overflow: hidden;
}

.line > span {
  display: block;
  transform: translateY(110%);
  transition: transform 700ms cubic-bezier(.16, 1, .3, 1);
  transition-delay: calc(var(--line) * 80ms);
}

.is-revealed .line > span {
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .line > span { transform: none; }
}`,
    Demo: MaskRevealDemo,
  },
  {
    id: 'underline-nav',
    number: '03',
    title: 'Underline that follows',
    category: 'Interaction',
    tech: 'CSS',
    summary: 'A focusable, hoverable navigation rule that grows from the start edge. State stays visible without relying on colour alone.',
    code: `.nav a {
  position: relative;
  text-decoration: none;
}

.nav a::after {
  content: "";
  position: absolute;
  inset: auto 0 -4px 0;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 240ms cubic-bezier(.16, 1, .3, 1);
}

.nav a:hover::after,
.nav a:focus-visible::after,
.nav a[aria-current="page"]::after {
  transform: scaleX(1);
}`,
    Demo: UnderlineNavDemo,
  },
  {
    id: 'magnetic-button',
    number: '04',
    title: 'Magnetic button',
    category: 'Interaction',
    tech: 'JS + CSS',
    summary: 'A restrained pointer-follow effect. Disabled for touch and reduced motion, and the button still behaves like a button from the keyboard.',
    code: `const button = document.querySelector('.magnetic');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');

button.addEventListener('pointermove', (event) => {
  if (reduce.matches || coarse.matches) return;
  const rect = button.getBoundingClientRect();
  const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
  const y = (event.clientY - rect.top - rect.height / 2) * 0.24;
  button.style.transform = \`translate(\${x}px, \${y}px)\`;
});

button.addEventListener('pointerleave', () => {
  button.style.transform = '';
});`,
    Demo: MagneticDemo,
  },
  {
    id: 'disclosure',
    number: '05',
    title: 'Disclosure',
    category: 'Components',
    tech: 'CSS + ARIA',
    summary: 'A native-feeling expander with a real aria-expanded state. The grid trick animates height without measuring anything in JavaScript.',
    code: `<button aria-expanded="false" aria-controls="panel-1">
  What counts as motion?
</button>

<div class="panel" id="panel-1">
  <div>Content stays in the DOM and remains accessible.</div>
</div>

<style>
.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 280ms cubic-bezier(.16, 1, .3, 1);
}

.panel > div { overflow: hidden; }
.is-open .panel { grid-template-rows: 1fr; }
</style>`,
    Demo: DisclosureDemo,
  },
  {
    id: 'tabs',
    number: '06',
    title: 'Tabs with a sliding indicator',
    category: 'Components',
    tech: 'CSS + ARIA',
    summary: 'Arrow-key navigation, roving tabindex, and an indicator that moves with the active tab. All three panels remain labelled correctly.',
    code: `<div role="tablist" aria-label="Topics">
  <button role="tab" aria-selected="true" aria-controls="panel-motion"
    id="tab-motion" tabindex="0">Motion</button>
  <button role="tab" aria-selected="false" aria-controls="panel-layout"
    id="tab-layout" tabindex="-1">Layout</button>
</div>

<div role="tabpanel" id="panel-motion" aria-labelledby="tab-motion" tabindex="0">
  ...
</div>

<script>
// ArrowRight / ArrowLeft / Home / End move focus and selection.
// Keep the active tab at tabindex="0" and the rest at tabindex="-1".
</script>`,
    Demo: TabsDemo,
  },
  {
    id: 'toast',
    number: '07',
    title: 'Toast with a way out',
    category: 'Feedback',
    tech: 'JS + ARIA',
    summary: 'A polite status message that does not steal focus, announces itself, dismisses itself, and can always be closed by hand.',
    code: `<div role="status" aria-live="polite">
  Demo toast — nothing was saved.
  <button aria-label="Dismiss notification">×</button>
</div>

<script>
const timer = setTimeout(hide, 4200);

dismiss.addEventListener('click', () => {
  clearTimeout(timer);
  hide();
});
</script>`,
    Demo: ToastDemo,
  },
  {
    id: 'skeleton',
    number: '08',
    title: 'Skeleton with reserved space',
    category: 'Feedback',
    tech: 'CSS + ARIA',
    summary: 'A loading state that occupies the same footprint as the final content. Shimmer is decorative, so it stops when motion is reduced.',
    code: `<section aria-busy="true" aria-live="polite">
  <div class="skeleton skeleton--title"></div>
  <div class="skeleton skeleton--line"></div>
</section>

<style>
.skeleton {
  background: #e7e2d4;
  border-radius: 2px;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  50% { opacity: 0.5; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
</style>`,
    Demo: SkeletonDemo,
  },
  {
    id: 'count-up',
    number: '09',
    title: 'Count up',
    category: 'Data',
    tech: 'JS',
    summary: 'A short, honest number reveal. Format with the user locale, skip the theatre for reduced motion, and label synthetic data clearly.',
    code: `function countUp(node, target = 1284, duration = 1100) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.textContent = target.toLocaleString();
    return;
  }

  const start = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}`,
    Demo: CounterDemo,
  },
  {
    id: 'before-after',
    number: '10',
    title: 'Before / after split',
    category: 'Media',
    tech: 'CSS + JS',
    summary: 'Compare two states with one native range input. The control is labelled, keyboard-operable, and the divider is driven by a single custom property.',
    code: `<div class="compare" style="--split: 52%">
  <div class="compare__before">…</div>
  <div class="compare__after">…</div>
</div>

<label>
  Split
  <input type="range" min="0" max="100" value="52" />
</label>

<style>
.compare { position: relative; }
.compare__after {
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 0 var(--split));
}
</style>`,
    Demo: CompareDemo,
  },
  {
    id: 'dialog',
    number: '11',
    title: 'Dialog that returns focus',
    category: 'Components',
    tech: 'HTML + ARIA',
    summary: 'The native dialog element handles the focus trap, Escape key, and backdrop. You still have to make the content earn the interruption.',
    code: `<dialog id="confirm" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Interrupt only when it matters.</h2>
  <p>One decision. One focused task.</p>
  <button autofocus>Close</button>
</dialog>

<script>
const dialog = document.querySelector('#confirm');
dialog.showModal();
// Escape closes natively and focus returns to the trigger.
</script>`,
    Demo: DialogDemo,
  },
  {
    id: 'parallax',
    number: '12',
    title: 'Parallax without the jank',
    category: 'Scroll',
    tech: 'JS + CSS',
    summary: 'Transform-only depth, calculated in a passive scroll handler and paused when off-screen. Reduced motion removes the effect entirely.',
    code: `const stage = document.querySelector('.stage');
let frame = 0;

addEventListener('scroll', () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = stage.getBoundingClientRect();
    const progress = (innerHeight - rect.top) / (innerHeight + rect.height);
    stage.style.setProperty('--shift', Math.min(1, Math.max(0, progress)));
  });
}, { passive: true });

/* CSS uses transform: translateY(calc(var(--shift) * 20px)); */`,
    Demo: ParallaxDemo,
  },
]

export function Library() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const rawCategory = params.get('category') ?? 'All'
  const category: Category = categories.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : 'All'
  const [openCode, setOpenCode] = useState<string[]>([])

  const setParam = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (!value || value === 'All') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return patterns.filter((pattern) => {
      const matchesCategory = category === 'All' || pattern.category === category
      const matchesQuery =
        !needle ||
        `${pattern.title} ${pattern.summary} ${pattern.category} ${pattern.tech}`
          .toLowerCase()
          .includes(needle)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  const toggleCode = (id: string) => {
    setOpenCode((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  return (
    <>
      <PageMeta
        title="Pattern library"
        description="Twelve tested interface motion patterns with live, keyboard-accessible demos and copyable CSS or JavaScript. Includes reduced-motion fallbacks."
        path="/library"
      />

      <header className="page-intro">
        <div className="wrap page-intro__grid">
          <p className="page-intro__label mono">03 / Library</p>
          <div className="page-intro__body">
            <h1>
              Twelve patterns, <em>ready to lift.</em>
            </h1>
            <div className="page-intro__lead">
              <p>
                Tested defaults for the jobs that come up again and again. Every demo runs here, in
                this page, with a reduced-motion fallback already in place.
              </p>
              <p>
                Filter by job. Read the intent before the code. Adapt the values to your system
                rather than copying them blindly.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="library-body" aria-labelledby="library-title">
        <div className="wrap">
          <h2 id="library-title" className="visually-hidden">Pattern collection</h2>

          <div className="library-toolbar">
            <div className="library-search">
              <label htmlFor="pattern-search" className="mono">Search patterns</label>
              <div className="library-search__field">
                <Icon name="search" size={16} />
                <input
                  id="pattern-search"
                  type="search"
                  className="text-input"
                  placeholder="Try “stagger”, “dialog”, “ARIA”…"
                  value={query}
                  onChange={(event) => setParam('q', event.target.value)}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    className="library-search__clear"
                    aria-label="Clear search"
                    onClick={() => setParam('q', '')}
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            </div>
            <p className="mono library-count" aria-live="polite">
              {String(filtered.length).padStart(2, '0')} / {patterns.length} patterns
            </p>
          </div>

          <div className="filter-row" role="group" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                aria-pressed={category === item}
                onClick={() => setParam('category', item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="library-note">
            <span className="mono">Note</span>
            <p>
              Each demo is keyboard-operable and honours the site motion switch. Code is minimal and
              illustrative — production projects should use their own tokens and components.
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="mono">No matches</span>
              <h3>Nothing under that name.</h3>
              <p>
                Try a broader term, or clear the filters. The library holds twelve patterns across
                seven jobs.
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setParams(new URLSearchParams(), { replace: true })
                }}
              >
                <Icon name="reset" size={14} /> Clear filters
              </button>
            </div>
          ) : (
            <div className="pattern-grid">
              {filtered.map((pattern, index) => {
                const isOpen = openCode.includes(pattern.id)
                return (
                  <Reveal as="article" key={pattern.id} className="pattern-card" delay={Math.min(index, 5) * 35} id={pattern.id}>
                    <div className="pattern-card__stage">
                      <pattern.Demo />
                    </div>
                    <div className="pattern-card__body">
                      <div className="pattern-card__meta mono">
                        <span>{pattern.number}</span>
                        <span>{pattern.category}</span>
                        <span>{pattern.tech}</span>
                      </div>
                      <h3 className="pattern-card__title">{pattern.title}</h3>
                      <p className="pattern-card__summary">{pattern.summary}</p>
                      <div className="pattern-card__foot">
                        <span className="tag">Reduced-motion ready</span>
                        <button
                          type="button"
                          className="text-link pattern-card__toggle"
                          aria-expanded={isOpen}
                          aria-controls={`code-${pattern.id}`}
                          onClick={() => toggleCode(pattern.id)}
                        >
                          {isOpen ? 'Hide code' : 'Show code'}
                          <Icon name={isOpen ? 'close' : 'arrow'} size={13} />
                        </button>
                      </div>
                      <div id={`code-${pattern.id}`} hidden={!isOpen}>
                        {isOpen && <CodeSample code={pattern.code} label={`${pattern.title} / ${pattern.tech}`} />}
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
