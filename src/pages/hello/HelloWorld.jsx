import { useState } from 'react'
import { useIframeMessages } from './helloIframeHook'
import './HelloWorld.css'

function HelloWorld() {
  const [selectedName, setSelectedName] = useState('')
  const { originalData } = useIframeMessages()

  // Extract names from the data array
  const getNames = () => {
    if (!originalData || !originalData.data || !Array.isArray(originalData.data) || originalData.data.length === 0) {
      return []
    }

    // Extract names from data array (each item has a "name" property)
    const names = originalData.data
      .map(item => item.name)
      .filter(name => name !== undefined && name !== null && name !== '')
    
    // Remove duplicates
    return [...new Set(names)]
  }

  // Get the id for the selected name
  const getSelectedId = () => {
    if (!selectedName || !originalData || !originalData.data || !Array.isArray(originalData.data)) {
      return null
    }

    // Find the item with the selected name
    const selectedItem = originalData.data.find(item => item.name === selectedName)
    return selectedItem ? selectedItem.id : null
  }

  const sendDataToParent = () => {
    if (!selectedName) return

    const selectedId = getSelectedId()
    const dataToSend = {
      id: selectedId
    }

    // Create LLM payload
    const llmPayload = {
      action: "name_selection",
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

  const names = getNames()

  return (
    <div className="hello-world-container">
      {originalData ? (
        <div className="dropdown-container">
          <label htmlFor="name-dropdown">Select a name:</label>
          <select
            id="name-dropdown"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="name-dropdown"
          >
            <option value="">-- Select a name --</option>
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
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default HelloWorld

