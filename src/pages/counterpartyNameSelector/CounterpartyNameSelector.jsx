import { useState } from 'react'
import '../../App.css'

function CounterpartyNameSelector() {
  const [userInput, setUserInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const message = `find contracts with counterparties ${userInput.trim()}`

    // Create LLM payload
    const llmPayload = {
      action: "counterparty_name_search",
      timestamp: new Date().toISOString(),
      data: {
        counterpartyName: userInput.trim(),
        message: message,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    }

    // Send data to parent
    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: message, // plain text
        llmMessage: JSON.stringify(llmPayload) // structured JSON
      },
      "*"
    )

    console.log("Data sent to parent:", {
      type: "ui_component_user_message",
      message: message,
      llmMessage: llmPayload
    })
    window.parent.postMessage({ type: 'ui_component_close' }, '*')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1em', fontWeight: 'bold', color: '#213547' }}>
          Counterparty Name Selector
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="counterparty-name">
              Counterparty Name:
            </label>
            <input
              id="counterparty-name"
              type="text"
              className="form-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter counterparty name"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!userInput.trim()}
            style={{
              backgroundColor: userInput.trim() ? '#646cff' : '#ccc',
              cursor: userInput.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default CounterpartyNameSelector

