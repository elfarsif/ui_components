import { useState } from 'react'
import '../App.css'
import { useIframeMessages } from '../hooks/useIframeMessages'

function FormPage() {
  const [message, setMessage] = useState("Sample user message from iframe")
  const [formValues, setFormValues] = useState({})

  // Receive data from iframe messages
  const { originalData } = useIframeMessages((initialValues) => {
    setFormValues(initialValues)
  })

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
        message: JSON.stringify(formValues),
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    )

    console.log("Form data sent to parent:", llmPayload)
  }

  return (
    <div>
      {originalData && originalData.columns && originalData.rows && originalData.rows.length > 0 ? (
        <div className="data-display">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              console.log("Form submitted with values:", formValues)
              sendFormDataToParent()
            }}
          >
            {originalData.columns.map((col, index) => {
              // Resolve column key
              const columnKey =
                typeof col === 'string'
                  ? col
                  : col.key || col.name || col.field || `column_${index}`

              // Resolve column label
              const columnLabel =
                typeof col === 'string'
                  ? col
                  : col.label || col.name || col.key || `Column ${index + 1}`

              // Current value
              const value = formValues[columnKey] ?? ''

              // Infer dropdown options from rows
              const inferredOptions = Array.from(
                new Set(
                  originalData.rows
                    .map((row) => row[columnKey])
                    .filter((v) => v !== undefined && v !== '')
                )
              )

              const isSelect = inferredOptions.length > 1

              const renderField = () => {
                if (isSelect) {
                  return (
                    <select
                      id={`field-${index}`}
                      value={value}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          [columnKey]: e.target.value
                        })
                      }
                      className="form-input"
                    >
                      {inferredOptions.map((opt, optIndex) => (
                        <option key={optIndex} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )
                }

                return (
                  <input
                    id={`field-${index}`}
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        [columnKey]: e.target.value
                      })
                    }
                    className="form-input"
                    placeholder={`Enter ${columnLabel.toLowerCase()}`}
                  />
                )
              }

              return (
                <div key={index} className="form-field">
                  <label htmlFor={`field-${index}`}>{columnLabel}</label>
                  {renderField()}
                </div>
              )
            })}

            <button type="submit" className="submit-button">
              Submit
            </button>
          </form>
        </div>
      ) : (
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default FormPage

