

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

