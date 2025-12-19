import { useState } from 'react'
import { useIframeMessages } from './counterpartyListIframeHook'
import '../../App.css'

function CounterpartyList() {
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

  const columns = getColumns()

  // Extract country code from address (typically at the end, e.g., "CN", "US")
  const getCountryCode = (row) => {
    const address = row.cf_cpAddress || row.address || ''
    // Try to extract country code from the end of the address
    // Common pattern: address ends with country code like "CN", "US", etc.
    const parts = address.trim().split(/\s+/)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      // Check if it's a 2-letter uppercase code (country code pattern)
      if (lastPart && lastPart.length === 2 && /^[A-Z]{2}$/.test(lastPart)) {
        return lastPart
      }
    }
    // Fallback: check if there's a country field
    if (row.country) return row.country
    return ''
  }

  // Get the primary name field and description field
  const getNameField = (row) => {
    if (row.name) return row.name
    const columns = getColumns()
    if (columns.length > 0) {
      const firstCol = columns[0]
      return row[firstCol.key] || 'N/A'
    }
    return 'N/A'
  }

  const getDescriptionField = (row) => {
    if (row.cf_cpAddress) return row.cf_cpAddress
    if (row.address) return row.address
    const columns = getColumns()
    if (columns.length > 1) {
      const secondCol = columns[1]
      return row[secondCol.key] || ''
    }
    return ''
  }

  const getIdField = (row) => {
    if (row.id) return row.id
    const columns = getColumns()
    if (columns.length > 0) {
      const firstCol = columns[0]
      return row[firstCol.key] || ''
    }
    return ''
  }

  return (
    <div>
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            maxWidth: '100%'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1em', fontWeight: 'bold', color: '#213547' }}>
                Counterparties
              </h2>
              <span
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  fontSize: '0.65em',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontWeight: 'normal'
                }}
              >
                preview
              </span>
            </div>
          </div>

          {/* List Items */}
          <div>
            {originalData.rows.map((row, index) => {
              const isSelected = isRowSelected(row, index)
              const countryCode = getCountryCode(row)
              const name = getNameField(row)
              const description = getDescriptionField(row)
              const id = getIdField(row)

              return (
                <div
                  key={getRowKey(row, index)}
                  onClick={() => handleRowClick(row)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem 0',
                    cursor: 'pointer',
                    borderBottom: index < originalData.rows.length - 1 ? '1px solid #e0e0e0' : 'none',
                    backgroundColor: isSelected ? '#f5f5f5' : 'transparent',
                    transition: 'background-color 0.2s',
                    borderRadius: '4px',
                    margin: '0 -0.5rem',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#fafafa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  >
                  {/* ID Block */}
                  {id && (
                    <div
                      style={{
                        minWidth: '40px',
                        marginRight: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75em',
                          color: '#213547',
                          fontWeight: '600',
                          lineHeight: '1'
                        }}
                      >
                        {id}
                      </div>
                    </div>
                  )}

                  {/* Name and Description */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      marginRight: '1rem'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75em',
                        color: '#213547',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        lineHeight: '1.3'
                      }}
                    >
                      {name}
                    </div>
                    {description && (
                      <div
                        style={{
                          fontSize: '0.65em',
                          color: '#999',
                          fontWeight: 'normal',
                          lineHeight: '1.3'
                        }}
                      >
                        {description}
                      </div>
                    )}
                  </div>

                  {/* Country Code/Right side */}
                  {countryCode && (
                    <div
                      style={{
                        fontSize: '0.7em',
                        color: '#666',
                        fontWeight: 'normal',
                        textAlign: 'right',
                        minWidth: '80px'
                      }}
                    >
                      {countryCode}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedRow}
              className="submit-button"
              style={{
                backgroundColor: selectedRow ? '#646cff' : '#ccc',
                cursor: selectedRow ? 'pointer' : 'not-allowed'
              }}
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

export default CounterpartyList
