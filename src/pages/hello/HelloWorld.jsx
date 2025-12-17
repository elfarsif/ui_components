import { useState } from 'react'
import { useIframeMessages } from '../../hooks/useIframeMessages'
import './HelloWorld.css'

function HelloWorld() {
  const [selectedName, setSelectedName] = useState('')
  const { originalData } = useIframeMessages()

  // Extract names from the payload
  const getNames = () => {
    if (!originalData || !originalData.columns || !originalData.rows || originalData.rows.length === 0) {
      return []
    }

    // Try to find a "name" column first, otherwise use the first column
    let nameColumn = null
    
    // Look for a column with "name" in it
    for (const col of originalData.columns) {
      const columnName = typeof col === 'string' 
        ? col 
        : (col.name || col.key || col.field || '')
      
      if (columnName.toLowerCase().includes('name')) {
        nameColumn = columnName
        break
      }
    }

    // If no "name" column found, use the first column
    if (!nameColumn && originalData.columns.length > 0) {
      const firstCol = originalData.columns[0]
      nameColumn = typeof firstCol === 'string' 
        ? firstCol 
        : (firstCol.name || firstCol.key || firstCol.field || 'column_0')
    }

    if (!nameColumn) return []

    // Extract unique names from rows
    const names = originalData.rows
      .map(row => row[nameColumn])
      .filter(name => name !== undefined && name !== null && name !== '')
    
    // Remove duplicates
    return [...new Set(names)]
  }

  // Find id column
  const getIdColumn = () => {
    if (!originalData || !originalData.columns) return null

    // Look for a column with "id" in it
    for (const col of originalData.columns) {
      const columnName = typeof col === 'string' 
        ? col 
        : (col.name || col.key || col.field || '')
      
      if (columnName.toLowerCase().includes('id')) {
        return columnName
      }
    }
    return null
  }

  // Get the id for the selected name
  const getSelectedId = () => {
    if (!selectedName || !originalData || !originalData.rows) return null

    // Find name column
    let nameColumn = null
    for (const col of originalData.columns) {
      const columnName = typeof col === 'string' 
        ? col 
        : (col.name || col.key || col.field || '')
      
      if (columnName.toLowerCase().includes('name')) {
        nameColumn = columnName
        break
      }
    }

    // If no "name" column found, use the first column
    if (!nameColumn && originalData.columns.length > 0) {
      const firstCol = originalData.columns[0]
      nameColumn = typeof firstCol === 'string' 
        ? firstCol 
        : (firstCol.name || firstCol.key || firstCol.field || 'column_0')
    }

    if (!nameColumn) return null

    const idColumn = getIdColumn()
    if (!idColumn) return null

    // Find the row with the selected name
    const selectedRow = originalData.rows.find(row => row[nameColumn] === selectedName)
    return selectedRow ? selectedRow[idColumn] : null
  }

  const sendDataToParent = () => {
    if (!selectedName) return

    const selectedId = getSelectedId()
    const dataToSend = {
      id: selectedId
    }

    // Create LLM payload
    const llmPayload = {
      action: "name_selection",
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

  const names = getNames()

  return (
    <div className="hello-world-container">
      {originalData ? (
        <div className="dropdown-container">
          <label htmlFor="name-dropdown">Select a name:</label>
          <select
            id="name-dropdown"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="name-dropdown"
          >
            <option value="">-- Select a name --</option>
            {names.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button 
            type="button"
            onClick={sendDataToParent}
            disabled={!selectedName}
            className="submit-button"
          >
            Submit
          </button>
        </div>
      ) : (
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default HelloWorld

