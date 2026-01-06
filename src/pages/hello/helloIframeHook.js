import { useState, useEffect } from 'react'

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

