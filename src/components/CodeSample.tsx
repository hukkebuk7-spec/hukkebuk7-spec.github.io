import { Icon } from '../components/Icons'
import { useCopy } from '../lib/useCopy'

export function CodeSample({ code, label = 'Code' }: { code: string; label?: string }) {
  const { copied, copy } = useCopy()

  return (
    <div className="code-block pattern-code">
      <div className="code-block__bar">
        <span>{label}</span>
        <button type="button" className="copy-btn" onClick={() => copy(code)}>
          <Icon name={copied ? 'check' : 'copy'} size={13} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre tabIndex={0} aria-label="Code sample"><code>{code}</code></pre>
    </div>
  )
}
