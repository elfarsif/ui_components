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
        data?.payload?.columns
      ) {
        const payload = data.payload

        // Normalize rows
        const baseRows =
          Array.isArray(payload.rows) && payload.rows.length > 0
            ? payload.rows
            : [{}]

        // Read extracted values (support multiple agent conventions)
        const extractedValues =
          payload.extracted_values ||
          payload.extractedValues ||
          payload.values ||
          {}

        // Merge extracted values into first row
        const mergedFirstRow = {
          ...baseRows[0],
          ...extractedValues
        }

        const normalizedPayload = {
          ...payload,
          rows: [mergedFirstRow]
        }

        setOriginalData(normalizedPayload)

        console.log("Normalized payload:", normalizedPayload)
        console.log("Columns:", normalizedPayload.columns)
        console.log("Rows:", normalizedPayload.rows)

        // Initialize form values
        const initialValues = {}

        normalizedPayload.columns.forEach((col, index) => {
          const columnName =
            typeof col === 'string'
              ? col
              : col.name || col.key || col.field || `column_${index}`

          initialValues[columnName] =
            mergedFirstRow[columnName] !== undefined
              ? mergedFirstRow[columnName]
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
