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

  return (
    <div>
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <>
          {columns.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={col.key || index}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '2px solid #646cff',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        fontSize: '0.6em'
                      }}
                    >
                      {col.label || col.key || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {originalData.rows.map((row, index) => {
                  const isSelected = isRowSelected(row, index)
                  return (
                    <tr
                      key={getRowKey(row, index)}
                      onClick={() => handleRowClick(row)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#e0e0e0' : index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                        borderBottom: '1px solid #ddd',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f0f0f0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'
                        }
                      }}
                    >
                      {columns.map((col, colIndex) => (
                        <td
                          key={col.key || colIndex}
                          style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd',
                            fontSize: '0.6em'
                          }}
                        >
                          {row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== '' 
                            ? String(row[col.key]) 
                            : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '0.6em' }}>No columns defined in data</p>
          )}
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
        </>
      ) : (
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default CounterpartyList
