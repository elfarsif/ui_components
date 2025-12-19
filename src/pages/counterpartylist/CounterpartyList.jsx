import { useState } from 'react'
import { useIframeMessages } from './counterpartyListIframeHook'

function CounterpartyList() {
  const { originalData } = useIframeMessages()
  const [selectedRow, setSelectedRow] = useState(null)

  const handleRowClick = (row) => {
    setSelectedRow(row)
  }

  const handleSubmit = () => {
    if (!selectedRow) return

    const dataToSend = {
      id: selectedRow.id || '',
      name: selectedRow.name || '',
      cf_cpAddress: selectedRow.cf_cpAddress || ''
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

  return (
    <div>
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr>
                {originalData.columns && originalData.columns.length > 0 ? (
                  originalData.columns.map((col, index) => (
                    <th
                      key={col.key || index}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '2px solid #646cff',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold'
                      }}
                    >
                      {col.label || col.key || `Column ${index + 1}`}
                    </th>
                  ))
                ) : (
                  <>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #646cff', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #646cff', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #646cff', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Address</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {originalData.rows.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => handleRowClick(row)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedRow?.id === row.id ? '#e0e0e0' : index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                    borderBottom: '1px solid #ddd',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRow?.id !== row.id) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRow?.id !== row.id) {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'
                    }
                  }}
                >
                  {originalData.columns && originalData.columns.length > 0 ? (
                    originalData.columns.map((col, colIndex) => (
                      <td
                        key={col.key || colIndex}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #ddd'
                        }}
                      >
                        {row[col.key] || 'N/A'}
                      </td>
                    ))
                  ) : (
                    <>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.id || 'N/A'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.name || 'N/A'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.cf_cpAddress || 'N/A'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRow}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: selectedRow ? '#646cff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedRow ? 'pointer' : 'not-allowed'
            }}
          >
            Submit
          </button>
        </>
      ) : (
        <p>Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default CounterpartyList
