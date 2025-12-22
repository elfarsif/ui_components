import { useState, useEffect } from 'react'
import '../App.css'

function FormPage_Add() {
  const [formValues, setFormValues] = useState({})
  const [missingFields, setMissingFields] = useState([])

  // Listen for iframe messages containing missing field names
  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data
      console.log("Message received:", data)
      console.log("data?.type:", data?.type)
      console.log("data?.source:", data?.source)
      console.log("data?.payload:", data?.payload)
      // Check for structured message with missing fields
      if (
        data?.type === "ui_component_render" &&
        data?.source === "agentos" &&
        data?.payload
      ) {
        const payload = data.payload
        
        // Accept missingFields as an array of field names
        if (Array.isArray(payload.missingFields) && payload.missingFields.length > 0) {
          setMissingFields(payload.missingFields)
          
          // Initialize form values with empty strings for each missing field
          const initialValues = {}
          payload.missingFields.forEach((fieldName) => {
            initialValues[fieldName] = ''
          })
          setFormValues(initialValues)
          console.log("Received missing fields:", payload.missingFields)
        }
        // Fallback: accept missingFields directly in payload
        else if (Array.isArray(data?.payload?.missingFields)) {
          setMissingFields(data.payload.missingFields)
          const initialValues = {}
          data.payload.missingFields.forEach((fieldName) => {
            initialValues[fieldName] = ''
          })
          setFormValues(initialValues)
        }
      }
      // Fallback: Check for direct missingFields array
      else if (Array.isArray(data?.missingFields) && data.missingFields.length > 0) {
        setMissingFields(data.missingFields)
        const initialValues = {}
        data.missingFields.forEach((fieldName) => {
          initialValues[fieldName] = ''
        })
        setFormValues(initialValues)
        console.log("Received missing fields (fallback):", data.missingFields)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  /**
   * Convert form values to readable plain text for chat
   */
  const formatFormValuesAsText = (values) => {
    return Object.entries(values)
      .map(([key, value]) => {
        const label = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        return `${label}: ${value}`
      })
      .join('\n')
  }

  /**
   * Send form submission to parent window
   */
  const sendFormDataToParent = () => {
    const llmPayload = {
      action: "form_submission",
      timestamp: new Date().toISOString(),
      data: {
        formFields: formValues,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    }

    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: formatFormValuesAsText(formValues), // plain text
        llmMessage: JSON.stringify(llmPayload)       // structured JSON
      },
      "*"
    )
  }

  /**
   * Format field name for display (convert snake_case to Title Case)
   */
  const formatFieldLabel = (fieldName) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div>
      {missingFields && missingFields.length > 0 ? (
        <div className="data-display">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendFormDataToParent()
            }}
          >
            {missingFields.map((fieldName, index) => {
              const fieldLabel = formatFieldLabel(fieldName)
              const value = formValues[fieldName] || ''

              return (
                <div key={index} className="form-field">
                  <label htmlFor={`field-${index}`}>
                    {fieldLabel}
                  </label>
                  <input
                    id={`field-${index}`}
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [fieldName]: e.target.value
                      }))
                    }
                    className="form-input"
                    placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                  />
                </div>
              )
            })}

            <button type="submit" className="submit-button">
              Submit
            </button>
          </form>
        </div>
      ) : (
        <p className="waiting-message">
          Waiting for missing field names from parent window...
        </p>
      )}
    </div>
  )
}

export default FormPage_Add