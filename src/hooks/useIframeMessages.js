import { useState, useEffect } from 'react'

/**
 * Custom hook to handle iframe messages from parent window
 * @param {Function} onDataReceived - Callback function called when data is received
 * @returns {Object} - Object containing originalData and setFormValues function
 */
export function useIframeMessages(onDataReceived) {
  const [originalData, setOriginalData] = useState(null)

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data;
      console.log("Message received:", data);
      if (
        data?.type === "ui_component_render" &&
        data?.source === "agentos" &&
        data?.payload?.columns &&
        data?.payload?.rows
      ) {
        setOriginalData(data.payload)
        console.log("Received data:", data.payload)
        console.log("Columns:", data.payload.columns)
        console.log("Rows:", data.payload.rows)
        
        // Initialize form values from first row
        if (data.payload.rows && data.payload.rows.length > 0) {
          const firstRow = data.payload.rows[0]
          const initialValues = {}
          
          // Extract column names and map to first row values
          data.payload.columns.forEach((col, index) => {
            // Handle both string columns and object columns
            const columnName = typeof col === 'string' 
              ? col 
              : (col.name || col.key || col.field || `column_${index}`)
            initialValues[columnName] = firstRow[columnName] !== undefined ? firstRow[columnName] : ''
          })
          
          // Call callback with initial values if provided
          if (onDataReceived) {
            onDataReceived(initialValues)
          }
          
          console.log("Initialized form values:", initialValues)
        }
      }
    }

    window.addEventListener("message", handleMessage)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onDataReceived])

  return { originalData }
}

