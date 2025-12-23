import { useState, useRef } from 'react'
import { useIframeMessages } from './helloIframeHook'
import './HelloWorld.css'

function HelloWorld() {
  const [selectedName, setSelectedName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const blurTimeoutRef = useRef(null)
  const { originalData } = useIframeMessages()

  /**
   * Extract unique names from rows
   */
  const getNames = () => {
    if (
      !originalData ||
      !Array.isArray(originalData.rows) ||
      originalData.rows.length === 0
    ) {
      return []
    }

    const names = originalData.rows
      .map(item => item.name)
      .filter(name => name && typeof name === 'string')

    return [...new Set(names)]
  }

  /**
   * Get ID for selected name
   */
  const getSelectedId = () => {
    if (!selectedName || !originalData?.rows) return null

    const selectedItem = originalData.rows.find(
      item => item.name === selectedName
    )

    return selectedItem?.id || null
  }

  /**
   * Send selection back to parent
   * - message → plain text (chat)
   * - llmMessage → structured JSON (agent)
   */
  const sendDataToParent = () => {
    if (!selectedName) return

    const selectedId = getSelectedId()

    const llmPayload = {
      action: "name_selection",
      timestamp: new Date().toISOString(),
      data: {
        id: selectedId,
        name: selectedName,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    }

    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: selectedId,//  plain text only
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    )
  }

  const names = getNames()
  const filteredNames = names.filter((name) =>
    name?.toString().toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  // Keep the current selection visible even if the filter no longer matches
  if (selectedName && !filteredNames.includes(selectedName)) {
    filteredNames.unshift(selectedName)
  }

  return (
    <div className="hello-world-container">
      {originalData ? (
        <div className="dropdown-container">
          <label htmlFor="name-dropdown">Select a Workflow:</label>

          <div className={`searchable-select ${isOpen ? 'open' : ''}`}>
            <div className="searchable-select__control">
              <input
                type="text"
                id="name-dropdown"
                className="name-dropdown searchable-select__input"
                placeholder="Search workflow"
                value={selectedName || searchTerm}
                onFocus={() => {
                  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                  setIsOpen(true)
                }}
                onChange={(e) => {
                  const next = e.target.value
                  setSearchTerm(next)
                  setSelectedName(next)
                }}
                onBlur={() => {
                  blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 120)
                }}
                autoComplete="off"
              />
              <span className="searchable-select__chevron" aria-hidden="true"></span>
            </div>
            {isOpen && (
              <div className="searchable-select__menu">
                {filteredNames.length === 0 && (
                  <div className="searchable-select__option searchable-select__option--empty">
                    No results
                  </div>
                )}
                {filteredNames.map((name, index) => (
                  <div
                    key={index}
                    className={`searchable-select__option ${
                      name === selectedName ? 'is-selected' : ''
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setSelectedName(name)
                      setSearchTerm(name)
                      setIsOpen(false)
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={sendDataToParent}
            disabled={!selectedName}
            className="submit-button"
          >
            Submit
          </button>
        </div>
      ) : (
        <p className="waiting-message">
          Waiting for data from parent window...
        </p>
      )}
    </div>
  )
}

export default HelloWorld
