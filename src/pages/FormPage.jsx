import { useState } from 'react'
import '../App.css'
import { useIframeMessages } from '../hooks/useIframeMessages'

function FormPage() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState("Sample user message from iframe")
  const [formValues, setFormValues] = useState({})

  // Use custom hook to handle iframe messages
  const { originalData } = useIframeMessages((initialValues) => {
    setFormValues(initialValues)
  })

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
                
                // Get field type (default to 'text')
                const fieldType = typeof col === 'object' && col.type 
                  ? col.type.toLowerCase() 
                  : 'text';
                
                // Get options for select/radio fields
                const options = typeof col === 'object' && col.options 
                  ? col.options 
                  : [];
                
                const value = formValues[columnName] !== undefined ? formValues[columnName] : '';
                
                // Handle different field types
                const renderField = () => {
                  if (fieldType === 'select' && options.length > 0) {
                    // Render dropdown/select
                    return (
                      <select
                        id={`field-${index}`}
                        value={value}
                        onChange={(e) => {
                          setFormValues({
                            ...formValues,
                            [columnName]: e.target.value
                          });
                        }}
                        className="form-input"
                      >
                        <option value="">-- Select an option --</option>
                        {options.map((option, optIndex) => {
                          const optionValue = typeof option === 'string' ? option : (option.value || option.label || option);
                          const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
                          return (
                            <option key={optIndex} value={optionValue}>
                              {optionLabel}
                            </option>
                          );
                        })}
                      </select>
                    );
                  } else if (fieldType === 'radio' && options.length > 0) {
                    // Render radio buttons
                    return (
                      <div className="radio-group">
                        {options.map((option, optIndex) => {
                          const optionValue = typeof option === 'string' ? option : (option.value || option.label || option);
                          const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
                          return (
                            <div key={optIndex} className="radio-option">
                              <input
                                type="radio"
                                id={`field-${index}-${optIndex}`}
                                name={columnName}
                                value={optionValue}
                                checked={value === optionValue}
                                onChange={(e) => {
                                  setFormValues({
                                    ...formValues,
                                    [columnName]: e.target.value
                                  });
                                }}
                                className="radio-input"
                              />
                              <label htmlFor={`field-${index}-${optIndex}`} className="radio-label">
                                {optionLabel}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    // Default to text input
                    return (
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
                    );
                  }
                };
                
                return (
                  <div key={index} className="form-field">
                    <label htmlFor={`field-${index}`}>
                      {columnLabel}:
                    </label>
                    {renderField()}
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

export default FormPage

