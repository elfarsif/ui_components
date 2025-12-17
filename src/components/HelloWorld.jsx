import { useState } from 'react'
import { useIframeMessages } from '../hooks/useIframeMessages'
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

  const names = getNames()

  return (
    <div className="hello-world-container">
      <h1>hello world</h1>
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
          {selectedName && (
            <p className="selected-name">Selected: {selectedName}</p>
          )}
        </div>
      ) : (
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default HelloWorld

