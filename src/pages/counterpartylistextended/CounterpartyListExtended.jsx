import { useState } from 'react'
import { useIframeMessages } from './counterpartyListExtendedIframeHook'
import '../../App.css'
import './CounterpartyListExtended.css'

function CounterpartyListExtended() {
  const { originalData } = useIframeMessages()
  const [selectedRow, setSelectedRow] = useState(null)

  // Get columns from data or infer from first row
  const getColumns = () => {
    if (originalData?.columns && originalData.columns.length > 0) {
      return originalData.columns
    }
    // If no columns defined, infer from first row
    if (originalData?.rows && originalData.rows.length > 0) {
      const firstRow = originalData.rows[0]
      return Object.keys(firstRow).map(key => ({
        key: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
      }))
    }
    return []
  }

  // Generate a unique key for row selection
  const getRowKey = (row, index) => {
    // Try to use Counterparty ID if available
    if (row.dyn102809) return row.dyn102809
    if (row.id) return row.id
    // Use first available unique field or index
    const columns = getColumns()
    if (columns.length > 0) {
      const keyValue = row[columns[0].key]
      if (keyValue) return `${columns[0].key}-${keyValue}-${index}`
    }
    return `row-${index}`
  }

  // Check if a row is selected
  const isRowSelected = (row, index) => {
    if (!selectedRow) return false
    const rowKey = getRowKey(row, index)
    const selectedKey = getRowKey(selectedRow, originalData?.rows?.indexOf(selectedRow) || -1)
    return rowKey === selectedKey
  }

  const handleRowClick = (row) => {
    setSelectedRow(row)
  }

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

  const handleSubmit = () => {
    if (!selectedRow) return

    // Send all fields from the selected row
    const dataToSend = { ...selectedRow }

    // Create LLM payload
    const llmPayload = {
      action: "counterparty_selection",
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
        message: formatFormValuesAsText(dataToSend), // plain text
        llmMessage: JSON.stringify(llmPayload)       // structured JSON
      },
      "*"
    )

    console.log("Data sent to parent:", {
      type: "ui_component_user_message",
      message: formatFormValuesAsText(dataToSend),
      llmMessage: llmPayload
    })
    window.parent.postMessage({ type: 'ui_component_close' }, '*')
  }

  const columns = getColumns()

  // Extract country code from address or country field
  const getCountryCode = (row) => {
    const address = row.address || row.cf_cpAddress || ''
    // Try to extract country code from the end of the address
    const parts = address.trim().split(/\s+/)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart.length === 2 && /^[A-Z]{2}$/.test(lastPart)) {
        return lastPart
      }
    }
    // Fallback: use first 2 letters of country name if available
    if (row.dyn102926) {
      const country = String(row.dyn102926).toUpperCase()
      if (country.length >= 2) {
        return country.substring(0, 2)
      }
    }
    if (row.country) return row.country
    return ''
  }

  // Get field value by key
  const getFieldValue = (row, key) => {
    const value = row[key]
    if (value === null || value === undefined || value === '') return null
    return String(value)
  }

  // Get field label by key
  const getFieldLabel = (key) => {
    const column = columns.find(col => col.key === key)
    return column ? column.label : key
  }

  return (
    <div>
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <div className="counterparty-list-wrapper">
          {/* Header */}
          <div className="counterparty-list-header">
            <h2 className="counterparty-list-title">Counterparties</h2>
            <span className="counterparty-list-count">preview</span>
          </div>

          {/* Card Grid */}
          <div className="counterparty-card-grid">
            {originalData.rows.map((row, index) => {
              const isSelected = isRowSelected(row, index)
              const countryCode = getCountryCode(row)
              
              // Get the first field value for the ID badge
              const firstColumn = columns.length > 0 ? columns[0] : null
              const firstFieldValue = firstColumn ? getFieldValue(row, firstColumn.key) : null

              return (
                <div
                  key={getRowKey(row, index)}
                  onClick={() => handleRowClick(row)}
                  className={`counterparty-card ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="counterparty-card__top">
                    {countryCode && (
                      <span className="counterparty-card__status">{countryCode}</span>
                    )}
                    {firstFieldValue && <span className="counterparty-card__id">{firstFieldValue}</span>}
                  </div>

                  <div className="counterparty-card__body">
                    {/* Display all fields with labels */}
                    {columns.map((column) => {
                      const value = getFieldValue(row, column.key)
                      if (!value) return null
                      
                      return (
                        <div key={column.key} className="counterparty-card__meta-line">
                          <span className="counterparty-card__meta-label-inline">
                            {column.label}: 
                          </span>
                          <span className="counterparty-card__meta-value-inline">
                            {value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submit Button */}
          <div className="counterparty-card__actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedRow}
              className="submit-button"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default CounterpartyListExtended
