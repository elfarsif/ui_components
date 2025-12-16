import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [originalData, setOriginalData] = useState(null)
  const [message, setMessage] = useState("Sample user message from iframe")
  const [formValues, setFormValues] = useState({})

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
        
        // Initialize form values from first row
        if (data.payload.rows && data.payload.rows.length > 0) {
          const firstRow = data.payload.rows[0];
          const initialValues = {};
          
          // Extract column names and map to first row values
          data.payload.columns.forEach((col, index) => {
            // Handle both string columns and object columns
            const columnName = typeof col === 'string' ? col : (col.name || col.key || col.field || `column_${index}`);
            initialValues[columnName] = firstRow[columnName] !== undefined ? firstRow[columnName] : '';
          });
          
          setFormValues(initialValues);
          console.log("Initialized form values:", initialValues);
        }
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

  const sendFormDataToParent = () => {
    // Create LLM payload with form data
    const llmPayload = {
      action: "form_submission",
      timestamp: new Date().toISOString(),
      data: {
        formFields: formValues,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    };

    // Send form data to parent with form fields and values as string
    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: JSON.stringify(formValues),
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    );

    console.log("Form data sent to parent:", {
      type: "ui_component_user_message",
      message: formValues,
      formFields: formValues,
      llmMessage: llmPayload
    });
  };

  return (
    <>
      <div>
        {originalData && originalData.columns && originalData.rows && originalData.rows.length > 0 && (
          <div className="data-display">
            <h2>Form</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submitted with values:", formValues);
              sendFormDataToParent();
            }}>
              {originalData.columns.map((col, index) => {
                // Extract column name - handle both string and object columns
                const columnName = typeof col === 'string' 
                  ? col 
                  : (col.name || col.key || col.field || col.label || `column_${index}`);
                
                // Get column label for display
                const columnLabel = typeof col === 'string' 
                  ? col 
                  : (col.label || col.name || col.key || col.field || `Column ${index + 1}`);
                
                const value = formValues[columnName] !== undefined ? formValues[columnName] : '';
                
                return (
                  <div key={index} className="form-field">
                    <label htmlFor={`field-${index}`}>
                      {columnLabel}:
                    </label>
                    <input
                      id={`field-${index}`}
                      type="text"
                      value={value}
                      onChange={(e) => {
                        setFormValues({
                          ...formValues,
                          [columnName]: e.target.value
                        });
                      }}
                      className="form-input"
                    />
                  </div>
                );
              })}
              <button type="submit" className="submit-button">
                Submit
              </button>
            </form>
          </div>
        )}
        {!originalData && (
          <p className="waiting-message">Waiting for data from parent window...</p>
        )}
      </div>
    </>
  )
}

export default App
