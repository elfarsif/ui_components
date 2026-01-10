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

    // Get name field
    const name = getFieldValue(selectedRow, 'name') || 'N/A'
    
    // Get address field
    const address = getFieldValue(selectedRow, 'address') || 'N/A'

    // Only send name and address
    const dataToSend = {
      name: name,
      address: address
    }

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

  // Get country name for sorting
  const getCountryName = (row) => {
    // Try to get country from dyn102926 field (Issuing country name)
    if (row.dyn102926) return String(row.dyn102926).toLowerCase()
    // Fallback to country field if available
    if (row.country) return String(row.country).toLowerCase()
    // Extract from address if available
    const address = row.address || row.cf_cpAddress || ''
    const parts = address.trim().split(/\s+/)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart.length === 2 && /^[A-Z]{2}$/.test(lastPart)) {
        return lastPart.toLowerCase()
      }
    }
    return 'zzz' // Put items without country at the end
  }

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
          {/* Card Grid */}
          <div className="counterparty-card-grid">
            {[...originalData.rows]
              .sort((a, b) => {
                const countryA = getCountryName(a)
                const countryB = getCountryName(b)
                return countryA.localeCompare(countryB)
              })
              .map((row, index) => {
              const isSelected = isRowSelected(row, index)
              const countryCode = getCountryCode(row)

              const name = getFieldValue(row, 'name') || getFieldValue(row, columns[0]?.key)
              const issuingCountry = getFieldValue(row, 'dyn102926') || getFieldValue(row, 'issuingCountryDescription') || getFieldValue(row, 'issuingCountry') || countryCode
              const addressLine = getFieldValue(row, 'address') || getFieldValue(row, 'cf_cpAddress') || ''
              const counterpartyId = getFieldValue(row, 'dyn102809') || getFieldValue(row, 'counterpartyId') || getFieldValue(row, 'id')

              const excludedKeys = new Set([
                'name',
                'address',
                'cf_cpAddress',
                'dyn102926',
                'issuingCountryDescription',
                'issuingCountry',
                'country'
              ])

              const detailFields = columns.filter(col => !excludedKeys.has(col.key))

              return (
                <div
                  key={getRowKey(row, index)}
                  onClick={() => handleRowClick(row)}
                  className={`counterparty-card ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="counterparty-card__header-row">
                    <div className="counterparty-card__header-left">
                      {name && <div className="counterparty-card__title">{name}</div>}
                      {(addressLine || counterpartyId) && (
                        <div className="counterparty-card__subtitle">
                          {counterpartyId && (
                            <span className="counterparty-card__subtitle-id">{counterpartyId}</span>
                          )}
                          {counterpartyId && addressLine && (
                            <span className="counterparty-card__subtitle-separator">|</span>
                          )}
                          {addressLine && (
                            <span className="counterparty-card__subtitle-address">{addressLine}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="counterparty-card__header-right">
                      <div
                        className="counterparty-card__meta-label counterparty-card__meta-label--title"
                        style={{ textTransform: 'none', letterSpacing: 0 }}
                      >
                        Issuing Country Description
                      </div>
                      <div className="counterparty-card__meta-value">{issuingCountry || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="counterparty-card__divider" />

                  <div className="counterparty-card__body">
                    {detailFields.map((column) => {
                      const value = getFieldValue(row, column.key)
                      const displayValue = value || '—'

                      return (
                        <div key={column.key} className="counterparty-card__meta-line">
                          <span className="counterparty-card__meta-label-inline">
                            {column.label}
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
export default CounterpartyListExtended
