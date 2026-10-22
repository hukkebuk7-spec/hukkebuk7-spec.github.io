import { PageMeta } from '../components/PageMeta'
import { Icon } from '../components/Icons'
import { Reveal } from '../components/Reveal'

const references = [
  {
    label: 'WCAG 2.2 — Animation from Interactions',
    href: 'https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html',
  },
  {
    label: 'MDN — CSS easing functions',
    href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function',
  },
  {
    label: 'MDN — prefers-reduced-motion',
    href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion',
  },
  {
    label: 'MDN — Web Animations API',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API',
  },
  {
    label: 'W3C — HTML dialog element',
    href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog',
  },
]

export function About() {
  return (
    <>
      <PageMeta
        title="Method & colophon"
        description="How TEMPO approaches interface motion: principles, accessibility, performance, and the honest limits of a static field guide. Full colophon and references."
        path="/about"
        type="article"
      />

      <header className="page-intro">
        <div className="wrap page-intro__grid">
          <p className="page-intro__label mono">04 / About</p>
          <div className="page-intro__body">
            <h1>
              A field guide, <em>not a rulebook.</em>
            </h1>
            <div className="page-intro__lead">
              <p>
                TEMPO collects working defaults for interface motion. It is opinionated about
                craft, sceptical of spectacle, and honest about the limits of a static publication.
              </p>
              <p>
                Edition 01 is an independent educational project. No clients, no case studies, no
                invented testimonials. Just patterns we can test in the browser.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="about-body">
        <section className="about-section" aria-labelledby="method-title">
          <div className="wrap about-grid">
            <div className="about-grid__label mono">01 / Method</div>
            <div className="about-grid__content">
              <h2 id="method-title" className="about-title">
                Read. Test. <em className="serif">Measure.</em> Cut.
              </h2>
              <div className="about-prose">
                <p className="about-lede">
                  Motion is a design material, not a finishing pass. It carries meaning: where
                  something came from, what changed, and what the interface expects next.
                </p>
                <p>
                  Every recommendation here is a starting point, not a law. The useful question is
                  never “does this animate?” but “what is this animation explaining?” If the answer
                  is nothing, the frame budget is better spent elsewhere.
                </p>
                <p>
                  The labs are deliberately small. They isolate timing so you can feel one decision
                  at a time. The pattern library shows the same idea in context. The motion budget
                  is the checklist before shipping. None of it replaces testing with real content,
                  on a real device, at a realistic network speed.
                </p>
              </div>

              <div className="about-steps">
                {[
                  { n: '01', title: 'Start with the job', copy: 'Orient, explain, or confirm. Name the purpose before choosing a curve.' },
                  { n: '02', title: 'Choose the smallest move', copy: 'Prefer a state change over a journey. Reserve longer sequences for rare, meaningful moments.' },
                  { n: '03', title: 'Test the floor', copy: 'Keyboard, reduced motion, low-end phone, slow connection. The floor is the experience.' },
                  { n: '04', title: 'Remove one thing', copy: 'If the interface still reads clearly without an animation, consider leaving it out.' },
                ].map((step) => (
                  <Reveal as="article" className="about-step" key={step.n}>
                    <span className="mono">{step.n}</span>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="about-section about-section--dark" aria-labelledby="access-title">
          <div className="wrap about-grid">
            <div className="about-grid__label mono">02 / Access</div>
            <div className="about-grid__content">
              <h2 id="access-title" className="about-title">
                Reduced motion is a <em className="serif">design state.</em>
              </h2>
              <div className="about-prose">
                <p className="about-lede">
                  It is not a broken version of the page. It is the same content, delivered with
                  less movement and the same meaning.
                </p>
                <p>
                  This site reads the operating-system preference, then lets you override it with
                  the motion switch in the header. The preference is stored locally. When motion is
                  reduced, decorative loops stop, the hero field holds still, lab previews jump to
                  their end state, and reveals are skipped rather than hidden.
                </p>
              </div>
              <ul className="about-access-list">
                <li><Icon name="check" size={15} /> Visible focus for every interactive element</li>
                <li><Icon name="check" size={15} /> Semantic landmarks, headings, and labels</li>
                <li><Icon name="check" size={15} /> Tabs, dialogs, and toasts with accessible state</li>
                <li><Icon name="check" size={15} /> No pointer-only or hover-only functionality</li>
                <li><Icon name="check" size={15} /> Text remains readable and selectable during motion</li>
              </ul>
              <p className="about-small">
                Automated checks are useful, but they are not proof. If you find a barrier, the
                pattern is wrong and should be fixed.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section" aria-labelledby="colophon-title">
          <div className="wrap about-grid">
            <div className="about-grid__label mono">03 / Colophon</div>
            <div className="about-grid__content">
              <h2 id="colophon-title" className="about-title">
                What this is <em className="serif">made of.</em>
              </h2>
              <dl className="colophon">
                <div>
                  <dt className="mono">Type</dt>
                  <dd>
                    Bricolage Grotesque for the working text, Instrument Serif for emphasis, DM
                    Mono for labels and timings. All self-hosted, all open source.
                  </dd>
                </div>
                <div>
                  <dt className="mono">Build</dt>
                  <dd>
                    React, TypeScript, and Vite. GSAP powers the stagger lab. The easing editor and
                    canvas field are hand-built. No component framework, no tracking scripts.
                  </dd>
                </div>
                <div>
                  <dt className="mono">Hosting</dt>
                  <dd>
                    Static files on Cloudflare Pages. The site runs entirely in the browser, so
                    there is no application database and no server-side account system.
                  </dd>
                </div>
                <div>
                  <dt className="mono">Data</dt>
                  <dd>
                    Your motion preference and motion-budget checklist live in localStorage. Nothing
                    is transmitted. There are no cookies, analytics, or third-party embeds.
                  </dd>
                </div>
                <div>
                  <dt className="mono">Limits</dt>
                  <dd>
                    The CSS <code className="code-inline">linear()</code> export needs a modern
                    browser. The labs are teaching tools, not a replacement for testing in your own
                    product. The library code is illustrative.
                  </dd>
                </div>
                <div>
                  <dt className="mono">Edition</dt>
                  <dd>Edition 01 — 2026. Static publication, revised by hand.</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="about-section about-section--sunk" aria-labelledby="refs-title">
          <div className="wrap about-grid">
            <div className="about-grid__label mono">04 / References</div>
            <div className="about-grid__content">
              <h2 id="refs-title" className="about-title">
                Read the <em className="serif">sources.</em>
              </h2>
              <p className="about-prose about-prose--single">
                The guide is built on public standards and browser documentation. Start here, then
                test the claims in your own context.
              </p>
              <ul className="reference-list">
                {references.map((reference) => (
                  <li key={reference.href}>
                    <a href={reference.href} target="_blank" rel="noreferrer">
                      <span>{reference.label}</span>
                      <Icon name="arrow-up-right" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
