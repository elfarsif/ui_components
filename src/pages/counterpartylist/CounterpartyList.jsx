import { useState } from 'react'
import { useIframeMessages } from './counterpartyListIframeHook'
import '../../App.css'
import './CounterpartyList.css'

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
    <div className="counterparty-list-wrapper">
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <div>
          {/* Header */}
          <div className="counterparty-list-header">
            <h2 className="counterparty-list-title">Counterparties</h2>
            <span className="counterparty-list-count">
              {originalData.rows.length} result{originalData.rows.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Card list */}
          <div className="counterparty-card-grid">
            {originalData.rows.map((row, index) => {
              const isSelected = isRowSelected(row, index)
              const countryCode = getCountryCode(row)
              const name = getNameField(row)
              const description = getDescriptionField(row)
              const id = getIdField(row)
              const status = row.status || countryCode || 'ACTIVE'
              const statusClass = (status || 'active').toString().toLowerCase().replace(/\s+/g, '-')
              const dateText = row.updatedAt || row.createdAt || row.date || ''
              const listLabel = row.list || row.segment || 'Product Growth'
              const cmrNumber = row.cmrNumber || row.cmr || ''
              const gbg = row.gbg || row.region || ''
              const ceid = row.ceid || ''
              const keywords =
                (Array.isArray(row.keywords) && row.keywords.filter(Boolean)) ||
                (row.tags && Array.isArray(row.tags) && row.tags.filter(Boolean)) ||
                []

              const rowKey = getRowKey(row, index)

              return (
                <div
                  key={rowKey}
                  className={`counterparty-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleRowClick(row)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleRowClick(row)
                    }
                  }}
                >
                  <div className="counterparty-card__top">
                    <span className={`counterparty-card__status ${status ? 'has-status' : ''} status-${statusClass}`}>
                      {status || 'ACTIVE'}
                    </span>
                    {id && <span className="counterparty-card__id">{id}</span>}
                  </div>

                    <div className="counterparty-card__body">
                      <div className="counterparty-card__name">{name}</div>
                      {dateText && <div className="counterparty-card__date">{dateText}</div>}
                      {description && <div className="counterparty-card__desc">{description}</div>}
                    {cmrNumber && (
                      <div className="counterparty-card__meta-line">
                        <span className="counterparty-card__meta-label-inline">CMR Number: </span>
                        <span className="counterparty-card__meta-value-inline">{cmrNumber}</span>
                      </div>
                    )}
                    {gbg && (
                      <div className="counterparty-card__meta-line">
                        <span className="counterparty-card__meta-label-inline">GBG: </span>
                        <span className="counterparty-card__meta-value-inline">{gbg}</span>
                      </div>
                    )}
                    {ceid && (
                      <div className="counterparty-card__meta-line">
                        <span className="counterparty-card__meta-label-inline">CEID: </span>
                        <span className="counterparty-card__meta-value-inline">{ceid}</span>
                      </div>
                    )}
                    </div>
                  {keywords && keywords.length > 0 && (
                    <div className="counterparty-card__keywords">
                      <div className="counterparty-card__chips">
                        {keywords.map((kw, kwIdx) => (
                          <span key={kwIdx} className="counterparty-card__chip">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
