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
      const data = event.data
      console.log("Message received:", data)

      if (
        data?.type === "ui_component_render" &&
        data?.source === "agentos" &&
        Array.isArray(data?.payload?.columns) &&
        Array.isArray(data?.payload?.rows)
      ) {
        const { columns, rows } = data.payload

        // Preserve rows exactly as sent (NO normalization to single row)
        const normalizedRows = rows.length > 0 ? rows : [{}]

        const normalizedPayload = {
          columns,
          rows: normalizedRows
        }

        setOriginalData(normalizedPayload)

        console.log("Normalized payload:", normalizedPayload)
        console.log("Columns:", columns)
        console.log("Rows:", normalizedRows)

        // Initialize form values from FIRST row only
        const initialValues = {}

        columns.forEach((col, index) => {
          const columnKey =
            typeof col === 'string'
              ? col
              : col.key || col.name || col.field || `column_${index}`

          initialValues[columnKey] =
            normalizedRows[0][columnKey] !== undefined
              ? normalizedRows[0][columnKey]
              : ''
        })

        if (onDataReceived) {
          onDataReceived(initialValues)
        }

        console.log("Initialized form values:", initialValues)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onDataReceived])

  return { originalData }
}