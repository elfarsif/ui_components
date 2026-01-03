import { useState } from 'react'
import { useIframeMessages } from './contractsOfCounterpartyIframeHook'
import '../../App.css'
import './ContractsOfCounterparty.css'

function ContractsOfCounterparty() {
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
    // Try to use id if available, otherwise create a composite key
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

  // Format value - display null as N/A
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A'
    }
    return value
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
        return `${label}: ${formatValue(value)}`
      })
      .join('\n')
  }

  const handleSubmit = () => {
    if (!selectedRow) return

    // Extract the first number from the id (before ":;")
    let message = "Id : CO-"
    if (selectedRow.id) {
      const idString = String(selectedRow.id)
      // Find the number before ":;"
      const match = idString.match(/^(\d+):;/)
      if (match && match[1]) {
        message = `Id : CO-${match[1]}`
      }
    }

    // Create LLM payload
    const llmPayload = {
      action: "contract_selection",
      timestamp: new Date().toISOString(),
      data: {
        ...selectedRow,
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
        message: message, // plain text with "Id : CO-{number}"
        llmMessage: JSON.stringify(llmPayload)       // structured JSON
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

  const columns = getColumns()

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

  // Extract country code or use issuing_country_name for status badge
  const getStatusBadge = (row) => {
    // Prioritize issuing_country_name first
    if (row.issuing_country_name) {
      const country = String(row.issuing_country_name).toUpperCase()
      // If it's a short country name (2-3 letters), use it as-is
      // Otherwise, take first 2 letters as country code
      if (country.length <= 3) {
        return country
      }
      // Extract first 2 letters for longer country names
      return country.substring(0, 2)
    }
    // Fallback to GBG
    if (row.GBG) return formatValue(row.GBG)
    // Fallback to CEID
    if (row.CEID) return formatValue(row.CEID)
    return 'N/A'
  }

  return (
    <div>
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <div className="counterparty-list-wrapper">
          {/* Header */}
          <div className="counterparty-list-header">
            <h2 className="counterparty-list-title">Contracts of Counterparty</h2>
            <span className="counterparty-list-count">preview</span>
          </div>

          {/* Card Grid */}
          <div className="counterparty-card-grid">
            {originalData.rows.map((row, index) => {
              const isSelected = isRowSelected(row, index)
              const statusBadge = getStatusBadge(row)
              
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
                    <span className="counterparty-card__status">{statusBadge}</span>
                    {firstFieldValue && <span className="counterparty-card__id">{firstFieldValue}</span>}
                  </div>

                  <div className="counterparty-card__body">
                    {/* Display all fields with labels */}
                    {columns.map((column) => {
                      const value = getFieldValue(row, column.key)
                      const displayValue = value || 'N/A'
                      
                      return (
                        <div key={column.key} className="counterparty-card__meta-line">
                          <span className="counterparty-card__meta-label-inline">
                            {column.label}: 
                          </span>
                          <span className="counterparty-card__meta-value-inline">
                            {displayValue}
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

export default ContractsOfCounterparty

