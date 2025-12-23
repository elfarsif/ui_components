import { useState, useRef } from 'react'
import '../App.css'
import { useIframeMessages } from '../hooks/useIframeMessages'
import DatePicker from '../components/DatePicker'
// testing 
function FormPage() {
  const [formValues, setFormValues] = useState({})
  const [searchTerms, setSearchTerms] = useState({})
  const [openDropdown, setOpenDropdown] = useState(null)
  const blurTimeoutRef = useRef(null)

  // Receive data from iframe messages
  const { originalData } = useIframeMessages((initialValues) => {
    setFormValues(initialValues)
  })

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
   * Normalize values before submit:
   * - Empty date fields → "N/A"
   */
  const normalizeFormValuesForSubmit = (values) => {
    const normalized = {}

    Object.entries(values).forEach(([key, value]) => {
      const isDateField = key.toLowerCase().includes('date')

      if (isDateField && (!value || value === '')) {
        normalized[key] = 'N/A'
      } else {
        normalized[key] = value
      }
    })

    return normalized
  }

  /**
   * Send form submission to parent window
   */
  const sendFormDataToParent = () => {
    const normalizedValues = normalizeFormValuesForSubmit(formValues)

    const llmPayload = {
      action: "form_submission",
      timestamp: new Date().toISOString(),
      data: {
        formFields: normalizedValues,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    }

    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: formatFormValuesAsText(normalizedValues), // plain text
        llmMessage: JSON.stringify(llmPayload)             // structured JSON
      },
      "*"
    )
  }

  return (
    <div>
      {originalData && originalData.columns && originalData.rows && originalData.rows.length > 0 ? (
        <div className="data-display">
          <form
            onSubmit={(e) => {
              e.preventDefault()
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

              // Detect date fields
              const isDateField =
                columnKey.toLowerCase().includes('date') ||
                columnLabel.toLowerCase().includes('date')

              // Raw value from form state
              const rawValue = formValues[columnKey]

              // NEVER pass "N/A" to DatePicker
              const value =
                isDateField && (rawValue === 'N/A' || rawValue === undefined || rawValue === null)
                  ? ''
                  : rawValue ?? ''

              // Infer dropdown options from rows
              const inferredOptions = Array.from(
                new Set(
                  originalData.rows
                    .map((row) => row[columnKey])
                    .filter((v) => v !== undefined && v !== '')
                )
              )

              const isSelect = !isDateField && inferredOptions.length > 1
              const searchTerm = searchTerms[columnKey] ?? ''
              const filteredOptions = inferredOptions.filter((opt) =>
                opt
                  ?.toString()
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )

              // Keep the currently selected value visible even if it does not match the filter
              if (value && !filteredOptions.includes(value)) {
                filteredOptions.unshift(value)
              }

              const renderField = () => {
                // Date picker
                if (isDateField) {
                  return (
                  <DatePicker
                    id={`field-${index}`}
                    value={value}
                    onChange={(dateString) => {
                      setFormValues((prev) => ({
                        ...prev,
                        [columnKey]: dateString
                      }))
                    }}
                  />
                  )
                }

                // Dropdown (searchable)
                if (isSelect) {
                  return (
                  <div
                    className={`searchable-select ${openDropdown === columnKey ? 'open' : ''}`}
                  >
                    <div className="searchable-select__control">
                      <input
                        type="text"
                        id={`field-${index}`}
                        className="form-input searchable-select__input"
                        placeholder={`Search ${columnLabel.toLowerCase()}`}
                        value={value || searchTerm}
                        onFocus={() => {
                          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                          setOpenDropdown(columnKey)
                        }}
                        onChange={(e) => {
                          const next = e.target.value
                          setSearchTerms((prev) => ({
                            ...prev,
                            [columnKey]: next
                          }))
                          setFormValues((prev) => ({
                            ...prev,
                            [columnKey]: next
                          }))
                        }}
                        onBlur={() => {
                          // Delay closing so option click can register
                          blurTimeoutRef.current = setTimeout(() => {
                            setOpenDropdown((prev) => (prev === columnKey ? null : prev))
                          }, 120)
                        }}
                        autoComplete="off"
                      />
                      <span className="searchable-select__chevron" aria-hidden="true"></span>
                    </div>
                    {openDropdown === columnKey && (
                      <div className="searchable-select__menu">
                        {filteredOptions.length === 0 && (
                          <div className="searchable-select__option searchable-select__option--empty">
                            No results
                          </div>
                        )}
                        {filteredOptions.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`searchable-select__option ${
                              opt === value ? 'is-selected' : ''
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setFormValues((prev) => ({
                                ...prev,
                                [columnKey]: opt
                              }))
                              setSearchTerms((prev) => ({
                                ...prev,
                                [columnKey]: opt
                              }))
                              setOpenDropdown(null)
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )
                }

                // Text input
                return (
                  <input
                    id={`field-${index}`}
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [columnKey]: e.target.value
                      }))
                    }
                    className="form-input"
                    placeholder={`Enter ${columnLabel.toLowerCase()}`}
                  />
                )
              }

              return (
                <div key={index} className="form-field">
                  <label htmlFor={`field-${index}`}>
                    {columnLabel}
                  </label>
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
        <p className="waiting-message">
          Waiting for data from parent window...
        </p>
      )}
    </div>
  )
}

export default FormPage