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
 *     "messages": [],
 *     "data": [
 *       {
 *         "id": "WL01002",
 *         "name": "MSA",
 *         "rule": "( ( 'userAttributes.User Department' = \"[Id=82,Name=MSA]\" ) OR ( 'source.entityTypeId' = 160 ) )",
 *         "publishedVersion": "487.0",
 *         "uuid": "bc98f914-81b6-41a4-b8da-897979c23be0"
 *       },
 *       ...
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
 *     },
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
        messages: {
          type: "array",
          items: {}
        },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                required: true
              },
              name: {
                type: "string",
                required: true
              },
              rule: {
                type: ["string", "null"]
              },
              publishedVersion: {
                type: "string"
              },
              uuid: {
                type: "string"
              }
            },
            required: ["id", "name"]
          }
        }
      },
      required: ["data"]
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

