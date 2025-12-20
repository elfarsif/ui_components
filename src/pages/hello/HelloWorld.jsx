import { useState } from 'react'
import { useIframeMessages } from './helloIframeHook'
import './HelloWorld.css'

function HelloWorld() {
  const [selectedName, setSelectedName] = useState('')
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
        message: selectedName, //  plain text only
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    )
  }

  const names = getNames()

  return (
    <div className="hello-world-container">
      {originalData ? (
        <div className="dropdown-container">
          <label htmlFor="name-dropdown">Select a Workflow:</label>

          <select
            id="name-dropdown"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="name-dropdown"
          >
            <option value="">-- Select a Workflow --</option>
            {names.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>

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
