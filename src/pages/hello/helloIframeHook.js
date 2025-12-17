import { useState, useEffect } from 'react'

/**
 * Custom hook to handle iframe messages from parent window
 * Local hook for HelloWorld page - accepts payload with { messages: [], data: [...] } structure
 * 
 * INPUT SCHEMA (Expected payload from parent):
 * 
 * Option 1: Structured message
 * {
 *   "type": "ui_component_render",
 *   "source": "agentos",
 *   "payload": {
 *     "messages": [],
 *     "data": [
 *       {
 *         "id": "WL01002",
 *         "name": "MSA",
 *         "rule": "...",
 *         "publishedVersion": "487.0",
 *         "uuid": "bc98f914-81b6-41a4-b8da-897979c23be0"
 *       }
 *     ]
 *   }
 * }
 * 
 * Option 2: Direct data structure (fallback)
 * {
 *   "messages": [],
 *   "data": [
 *     {
 *       "id": "WL01002",
 *       "name": "MSA",
 *       "rule": "...",
 *       "publishedVersion": "487.0",
 *       "uuid": "bc98f914-81b6-41a4-b8da-897979c23be0"
 *     }
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
 * @returns {Object} - Object containing originalData with data array
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
        data?.payload?.data &&
        Array.isArray(data.payload.data)
      ) {
        const payload = data.payload
        setOriginalData(payload)
        console.log("Received payload:", payload)
        console.log("Data array:", payload.data)
        console.log("Messages:", payload.messages)
      }
      // Fallback: Check for direct data structure
      else if (data?.data && Array.isArray(data.data)) {
        setOriginalData(data)
        console.log("Received payload (fallback):", data)
        console.log("Data array:", data.data)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onDataReceived])

  return { originalData }
}

