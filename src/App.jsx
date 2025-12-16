import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [originalData, setOriginalData] = useState(null)
  const [message, setMessage] = useState("Sample user message from iframe")

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data;

      if (
        data?.type === "ui_component_render" &&
        data?.source === "agentos" &&
        data?.payload?.columns &&
        data?.payload?.rows
      ) {
        setOriginalData(data.payload);
        console.log("Received data:", data.payload);
        console.log("Columns:", data.payload.columns);
        console.log("Rows:", data.payload.rows);
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const sendMessageToParent = () => {
    // Sample LLM payload
    const llmPayload = {
      action: "user_response",
      timestamp: new Date().toISOString(),
      data: {
        selectedOption: "Option 1",
        userInput: message,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    };

    // Send message to parent
    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: message,
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    );

    console.log("Message sent to parent:", {
      type: "ui_component_user_message",
      message: message,
      llmMessage: llmPayload
    });
  };

  return (
    <>
      <div>
        {originalData && (
          <div className="data-display">
            <h2>Received Data</h2>
            <div className="data-info">
              <p><strong>Columns:</strong> {originalData.columns?.length || 0}</p>
              <p><strong>Rows:</strong> {originalData.rows?.length || 0}</p>
            </div>
            {originalData.columns && (
              <div className="columns-preview">
                <h3>Columns:</h3>
                <ul>
                  {originalData.columns.map((col, index) => (
                    <li key={index}>{JSON.stringify(col)}</li>
                  ))}
                </ul>
              </div>
            )}
            {originalData.rows && originalData.rows.length > 0 && (
              <div className="rows-preview">
                <h3>First Row Sample:</h3>
                <pre>{JSON.stringify(originalData.rows[0], null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        {!originalData && (
          <p className="waiting-message">Waiting for data from parent window...</p>
        )}
      </div>
      <h1>Vite + React</h1>
      
      <div className="message-section">
        <h2>Send Message to Parent</h2>
        <div className="message-controls">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to send to parent"
            className="message-input"
          />
          <button onClick={sendMessageToParent} className="send-button">
            Send Message to Parent
          </button>
        </div>
        <p className="message-hint">
          This will send a message to the parent window with type "ui_component_user_message"
        </p>
      </div>
    </>
  )
}

export default App
