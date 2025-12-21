import { useEffect, useMemo, useState } from 'react'
import './SidePanel.css'

/**
 * Default / fallback payload
 */
const DEFAULT_PANEL = {
  heading: 'Side Panel',
  subheading: '',
  summary: '',
  highlights: [],
  actions: [],
  note: '',
  iframeUrl: null,
  mode: 'iframe' // default to iframe-only experience
}

/**
 * Normalize agent payload into safe panel state
 */
const normalizePayload = (payload = {}) => {
  const highlights = Array.isArray(payload.highlights)
    ? payload.highlights
        .filter((h) => h && (h.label || h.value || h.text))
        .map((h) => ({
          label: h.label || h.key || 'Detail',
          value: h.value || h.text || ''
        }))
    : []

  const iframeUrl = typeof payload.iframeUrl === 'string' ? payload.iframeUrl : null
  const mode = payload.mode || 'iframe'

  return {
    ...DEFAULT_PANEL,
    ...payload,
    highlights,
    actions: [], 
    iframeUrl,
    mode
  }
}

function SidePanel() {
  const [panel, setPanel] = useState(DEFAULT_PANEL)
  const [isLive, setIsLive] = useState(false)

  const handleClose = () => {
    window.parent.postMessage({ type: 'ui_component_close' }, '*')
    console.log('Closing side panel')
  }

  /**
   * Listen for agent → UI messages
   */
  useEffect(() => {
    const handleMessage = (event) => {
      const data = event?.data
      if (!data || typeof data !== 'object') return

      // Primary agent render event
      if (data.type === 'ui_component_render' && data.source === 'agentos' && data.payload) {
        setPanel(normalizePayload(data.payload))
        setIsLive(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="side-panel">
      <button
        type="button"
        className="side-panel__close-btn"
        onClick={handleClose}
        aria-label="Close side panel"
      >
        ✕
      </button>
      <main className="side-panel__body">
        {panel.iframeUrl ? (
          <iframe
            key={panel.iframeUrl}
            src={panel.iframeUrl}
            title={panel.heading || 'Side Panel'}
            className="side-panel__iframe"
            loading="lazy"
          />
        ) : (
          <div className="side-panel__empty">Awaiting iframeUrl from payload...</div>
        )}
      </main>
    </div>
  )
}

export default SidePanel
