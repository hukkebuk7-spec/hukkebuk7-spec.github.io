import { PageMeta } from '../components/PageMeta'
import { Reveal } from '../components/Reveal'
import { EasingLab } from '../features/EasingLab'
import { SpringLab } from '../features/SpringLab'
import { StaggerLab } from '../features/StaggerLab'
import { Icon } from '../components/Icons'

const tools = [
  { id: 'easing', n: '01', label: 'Easing' },
  { id: 'spring', n: '02', label: 'Spring' },
  { id: 'stagger', n: '03', label: 'Stagger' },
  { id: 'defaults', n: '04', label: 'Defaults' },
]

export function Lab() {
  return (
    <>
      <PageMeta
        title="The lab"
        description="A working easing editor, spring simulator, and stagger composer for interface motion. Tune the curve, feel the timing, copy production-ready CSS."
        path="/lab"
      />

      <header className="page-intro">
        <div className="wrap page-intro__grid">
          <p className="page-intro__label mono">02 / The lab</p>
          <div className="page-intro__body">
            <h1>
              Tune motion <em>by feel.</em>
            </h1>
            <div className="page-intro__lead">
              <p>
                Three tools for the part of motion that is hard to reason about: timing. Drag a
                curve, run a spring, compose a stagger. Then copy the CSS or JS.
              </p>
              <p>
                Everything runs locally in your browser. No account, no upload, no tracking. The
                current curve is stored in the URL so you can share the exact motion.
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav className="lab-toc" aria-label="Lab tools">
        <div className="wrap lab-toc__inner">
          <span className="mono lab-toc__label">Tools</span>
          <ol>
            {tools.map((tool) => (
              <li key={tool.id}>
                <a href={`#${tool.id}`}>
                  <span className="mono">{tool.n}</span>
                  {tool.label}
                </a>
              </li>
            ))}
          </ol>
          <span className="mono lab-toc__meta">Runs locally</span>
        </div>
      </nav>

      <div className="lab-body">
        <section className="lab-section" id="easing" aria-labelledby="easing-title">
          <div className="wrap">
            <Reveal className="lab-section__head">
              <span className="mono lab-section__index">01 / Easing</span>
              <div>
                <h2 id="easing-title">Curves, not <em className="serif">guesswork.</em></h2>
                <p>
                  A cubic bezier maps progress to time. Drag the two control points until the
                  movement has the weight you want, then verify it at the duration you will actually
                  ship. Small budget, real decisions.
                </p>
              </div>
              <span className="tag">CSS</span>
            </Reveal>
            <EasingLab />
          </div>
        </section>

        <section className="lab-section lab-section--sunk" id="spring" aria-labelledby="spring-title">
          <div className="wrap">
            <Reveal className="lab-section__head">
              <span className="mono lab-section__index">02 / Spring</span>
              <div>
                <h2 id="spring-title">Weight is a <em className="serif">physical</em> argument.</h2>
                <p>
                  Springs respond to stiffness, damping, and mass. Tune them here, watch the
                  settling behaviour, then export a sampled <code className="code-inline">linear()</code>{' '}
                  curve you can use in plain CSS.
                </p>
              </div>
              <span className="tag">CSS + linear()</span>
            </Reveal>
            <SpringLab />
          </div>
        </section>

        <section className="lab-section" id="stagger" aria-labelledby="stagger-title">
          <div className="wrap">
            <Reveal className="lab-section__head">
              <span className="mono lab-section__index">03 / Stagger</span>
              <div>
                <h2 id="stagger-title">Choreography is <em className="serif">rhythm.</em></h2>
                <p>
                  A stagger turns a group of elements into a sequence. Keep the gap proportional to
                  the number of items, and cap the total time before it becomes a wait. This preview
                  uses the same GSAP timing you can copy below.
                </p>
              </div>
              <span className="tag">GSAP</span>
            </Reveal>
            <StaggerLab />
          </div>
        </section>

        <section className="lab-section lab-section--sunk" id="defaults" aria-labelledby="defaults-title">
          <div className="wrap">
            <Reveal className="lab-section__head">
              <span className="mono lab-section__index">04 / House defaults</span>
              <div>
                <h2 id="defaults-title">A defensible <em className="serif">starting point.</em></h2>
                <p>
                  These are the values this guide reaches for first. They are not universal laws.
                  Use them until context gives you a better answer, then write down why.
                </p>
              </div>
              <span className="tag">Reference</span>
            </Reveal>

            <div className="defaults">
              <div
                className="defaults__table-wrap"
                role="region"
                aria-label="Recommended motion durations, scroll horizontally to view every column"
                tabIndex={0}
              >
                <table className="defaults__table">
                  <caption className="visually-hidden">
                    Recommended durations for common interface motion jobs
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Job</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Easing</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">State feedback</th>
                      <td>100–140 ms</td>
                      <td>ease-out</td>
                      <td>Hover, press, toggle. Fast enough to feel causal.</td>
                    </tr>
                    <tr>
                      <th scope="row">Small overlay</th>
                      <td>160–220 ms</td>
                      <td>cubic-bezier(.16,1,.3,1)</td>
                      <td>Tooltips, menus, small popovers.</td>
                    </tr>
                    <tr>
                      <th scope="row">Component transition</th>
                      <td>220–320 ms</td>
                      <td>cubic-bezier(.16,1,.3,1)</td>
                      <td>Cards, disclosures, expandable panels.</td>
                    </tr>
                    <tr>
                      <th scope="row">Page / view change</th>
                      <td>320–520 ms</td>
                      <td>cubic-bezier(.65,0,.35,1)</td>
                      <td>Preserve context; avoid blocking navigation.</td>
                    </tr>
                    <tr>
                      <th scope="row">Decorative sequence</th>
                      <td>up to 1200 ms</td>
                      <td>custom</td>
                      <td>Only when it never delays access to content.</td>
                    </tr>
                    <tr>
                      <th scope="row">Reduced motion</th>
                      <td>0–1 ms</td>
                      <td>none</td>
                      <td>Keep state changes legible; remove the travel.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <aside className="defaults__aside">
                <div className="defaults__card">
                  <span className="mono">The two-question test</span>
                  <p>
                    Does this animation explain a change? If yes, make it legible. If no, does it
                    earn the attention it takes? If not, remove it.
                  </p>
                </div>
                <div className="defaults__card defaults__card--signal">
                  <span className="mono">Reduced motion is not a downgrade</span>
                  <p>
                    It is a different art direction for the same content. Replace travel with a
                    short fade, or remove the transition entirely and keep the final state.
                  </p>
                  <a
                    className="text-link"
                    href="https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read WCAG guidance <Icon name="arrow-up-right" size={13} />
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
