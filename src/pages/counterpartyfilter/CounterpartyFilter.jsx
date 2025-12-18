import { useState } from 'react'

function CounterpartyFilter() {
  const [counterpartyName, setCounterpartyName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!counterpartyName.trim()) return

    const dataToSend = {
      counterpartyName: counterpartyName.trim()
    }

    // Create LLM payload
    const llmPayload = {
      action: "counterparty_search",
      timestamp: new Date().toISOString(),
      data: {
        ...dataToSend,
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
        message: JSON.stringify(dataToSend),
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    )

    console.log("Data sent to parent:", {
      type: "ui_component_user_message",
      message: dataToSend,
      llmMessage: llmPayload
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="counterparty-name">Counterparty Name:</label>
          <input
            id="counterparty-name"
            type="text"
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder="Enter counterparty name"
          />
        </div>
        <button type="submit" disabled={!counterpartyName.trim()}>
          Submit
        </button>
      </form>
    </div>
  )
}

export default CounterpartyFilter
