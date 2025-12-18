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
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {originalData.rows.map((row, index) => (
              <li
                key={row.id || index}
                onClick={() => handleRowClick(row)}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  cursor: 'pointer',
                  backgroundColor: selectedRow?.id === row.id ? '#e0e0e0' : 'transparent',
                  border: selectedRow?.id === row.id ? '2px solid #646cff' : '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <strong>{row.name || 'N/A'}</strong>
                {row.cf_cpAddress && (
                  <span> - {row.cf_cpAddress}</span>
                )}
              </li>
            ))}
          </ul>
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
