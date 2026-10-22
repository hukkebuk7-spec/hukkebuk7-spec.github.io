import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { Icon } from '../components/Icons'

export function NotFound() {
  return (
    <>
      <PageMeta
        title="Page not found"
        description="This page has left the timeline. Return to TEMPO's field guide to interface motion."
        path="/404"
        noindex
      />

      <section className="not-found">
        <div className="wrap not-found__grid">
          <div className="not-found__copy">
            <p className="mono">Error / 404</p>
            <h1>
              This page <em className="serif">left the timeline.</em>
            </h1>
            <p>
              The URL does not match a page in this edition. It may have moved, or the link may be
              incomplete. Nothing has been lost.
            </p>
            <div className="not-found__actions">
              <Link className="btn btn--signal" to="/">
                Return to the index <Icon name="arrow" size={16} />
              </Link>
              <Link className="text-link" to="/library">
                Browse the library <Icon name="arrow-up-right" size={13} />
              </Link>
            </div>
          </div>
          <div className="not-found__figure" aria-hidden="true">
            <span className="not-found__number">404</span>
            <span className="not-found__line" />
            <span className="mono">Off the curve / no destination</span>
          </div>
        </div>
      </section>
    </>
  )
}
