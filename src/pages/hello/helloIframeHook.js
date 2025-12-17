import { useState, useEffect } from 'react'

/**
 * Custom hook to handle iframe messages from parent window
 * Local hook for HelloWorld page - accepts payload with { columns: [...], rows: [...] } structure
 * 
 * INPUT SCHEMA (Expected payload from parent):
 * 
 * Option 1: Structured message
 * {
 *   "type": "ui_component_render",
 *   "source": "agentos",
 *   "payload": {
 *     "columns": [
 *       {"key": "id", "label": "Workflow ID"},
 *       {"key": "name", "label": "Workflow Name"}
 *     ],
 *     "rows": [
 *       {"id": "WL01002", "name": "MSA"},
 *       {"id": "WL01005", "name": "Other Folder"},
 *       ...
 *     ]
 *   }
 * }
 * 
 * Option 2: Direct data structure (fallback)
 * {
 *   "columns": [
 *     {"key": "id", "label": "Workflow ID"},
 *     {"key": "name", "label": "Workflow Name"}
 *   ],
 *   "rows": [
 *     {"id": "WL01002", "name": "MSA"},
 *     {"id": "WL01005", "name": "Other Folder"},
 *     ...
 *   ]
 * }
 * 
 * OUTPUT SCHEMA (Sent back to parent):
 * {
 *   "type": "ui_component_user_message",
 *   "message": "{\"id\":\"WL01002\"}",
 *   "llmMessage": "{\"action\":\"name_selection\",\"timestamp\":\"...\",\"data\":{\"id\":\"WL01002\",\"metadata\":{...}}}"
 * }
 * 
 * @param {Function} onDataReceived - Callback function called when data is received
 * @returns {Object} - Object containing originalData with columns and rows arrays
 */
export function useIframeMessages(onDataReceived) {
  const [originalData, setOriginalData] = useState(null)

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data
      console.log("Message received:", data)

      // Check for structured message with type and source
      if (
        data?.type === "ui_component_render" &&
        data?.source === "agentos" &&
        data?.payload?.columns &&
        Array.isArray(data.payload.columns) &&
        data?.payload?.rows &&
        Array.isArray(data.payload.rows)
      ) {
        const payload = data.payload
        setOriginalData(payload)
        console.log("Received payload:", payload)
        console.log("Columns array:", payload.columns)
        console.log("Rows array:", payload.rows)
      }
      // Fallback: Check for direct data structure
      else if (
        data?.columns &&
        Array.isArray(data.columns) &&
        data?.rows &&
        Array.isArray(data.rows)
      ) {
        setOriginalData(data)
        console.log("Received payload (fallback):", data)
        console.log("Columns array:", data.columns)
        console.log("Rows array:", data.rows)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onDataReceived])

  return { originalData }
}

