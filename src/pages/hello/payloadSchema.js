/**
 * Input Schema for HelloWorld page iframe payload
 * 
 * Expected payload structure from parent window:
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
 * Output Schema (sent back to parent):
 * {
 *   "type": "ui_component_user_message",
 *   "message": "{\"id\":\"WL01002\"}",
 *   "llmMessage": "{\"action\":\"name_selection\",\"timestamp\":\"...\",\"data\":{\"id\":\"WL01002\",\"metadata\":{...}}}"
 * }
 */

export const inputSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["ui_component_render"]
    },
    source: {
      type: "string",
      enum: ["agentos"]
    },
    payload: {
      type: "object",
      properties: {
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                required: true
              },
              label: {
                type: "string",
                required: true
              }
            },
            required: ["key", "label"]
          }
        },
        rows: {
          type: "array",
          items: {
            type: "object",
            description: "Object with properties matching the keys from columns array"
          }
        }
      },
      required: ["columns", "rows"]
    }
  }
}

export const outputSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["ui_component_user_message"]
    },
    message: {
      type: "string",
      description: "JSON stringified object with selected id: {\"id\":\"WL01002\"}"
    },
    llmMessage: {
      type: "string",
      description: "JSON stringified payload with action, timestamp, and data"
    }
  },
  required: ["type", "message", "llmMessage"]
}

