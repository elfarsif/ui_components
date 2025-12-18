import { useState, useEffect } from 'react'
import '../App.css'

function Dropdown() {
  const [selectedAgreement, setSelectedAgreement] = useState('')
  const [agreementList, setAgreementList] = useState([])
  const [prefilledSelection, setPrefilledSelection] = useState('')

  // Handle iframe messages from parent window
  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data
      console.log("Message received:", data)

      // Check for structured message with type and source
      if (
        data?.type === "ui_component_render" &&
        data?.source === "agentos" &&
        data?.payload
      ) {
        const payload = data.payload
        
        // Extract prefilled_selection and list from payload
        const prefilled = payload.prefilled_selection || payload.prefilledSelection || ''
        const list = payload.list || payload.agreementList || payload['List of the Type of agreement'] || []
        
        setPrefilledSelection(prefilled)
        setAgreementList(Array.isArray(list) ? list : [])
        
        // Set the selected value to prefilled_selection
        if (prefilled) {
          setSelectedAgreement(prefilled)
        }
        
        console.log("Received payload:", payload)
        console.log("Prefilled selection:", prefilled)
        console.log("Agreement list:", list)
      }
      // Fallback: Check for direct data structure
      else if (data?.prefilled_selection !== undefined || data?.list !== undefined) {
        const prefilled = data.prefilled_selection || data.prefilledSelection || ''
        const list = data.list || data.agreementList || data['List of the Type of agreement'] || []
        
        setPrefilledSelection(prefilled)
        setAgreementList(Array.isArray(list) ? list : [])
        
        if (prefilled) {
          setSelectedAgreement(prefilled)
        }
        
        console.log("Received payload (fallback):", data)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  // Initialize selected value when prefilledSelection changes
  useEffect(() => {
    if (prefilledSelection && !selectedAgreement) {
      setSelectedAgreement(prefilledSelection)
    }
  }, [prefilledSelection])

  const handleSubmit = () => {
    if (!selectedAgreement) return

    // Create LLM payload
    const llmPayload = {
      action: "agreement_selection",
      timestamp: new Date().toISOString(),
      data: {
        selectedAgreement: selectedAgreement,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    }

    // Send message to parent with the selected Type of agreement
    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: selectedAgreement,
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    )

    console.log("Agreement sent to parent:", {
      type: "ui_component_user_message",
      message: selectedAgreement,
      llmMessage: llmPayload
    })
  }

  return (
    <div className="dropdown-container">
      {agreementList.length > 0 ? (
        <div className="data-display">
          <div className="form-field">
            <label htmlFor="agreement-dropdown">Type of agreement:</label>
            <select
              id="agreement-dropdown"
              value={selectedAgreement}
              onChange={(e) => setSelectedAgreement(e.target.value)}
              className="form-input"
            >
              <option value="">-- Select Type of agreement --</option>
              {agreementList.map((agreement, index) => {
                const agreementValue = typeof agreement === 'string' 
                  ? agreement 
                  : (agreement.value || agreement.label || agreement)
                const agreementLabel = typeof agreement === 'string' 
                  ? agreement 
                  : (agreement.label || agreement.value || agreement)
                
                return (
                  <option key={index} value={agreementValue}>
                    {agreementLabel}
                  </option>
                )
              })}
            </select>
          </div>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={!selectedAgreement}
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

export default Dropdown

