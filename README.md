# UI Components App

A React application containing reusable UI components designed to work within iframes. Components communicate with parent windows via postMessage API and can receive data payloads to render dynamic forms, dropdowns, and data tables.

## Structure

```
src/
├── components/          # Reusable components
│   └── DatePicker.jsx  # Date picker component
├── hooks/              # Shared React hooks
│   └── useIframeMessages.js  # Hook for handling iframe messages
├── pages/              # Page components
│   ├── FormPage.jsx    # Dynamic form generator
│   ├── Dropdown.jsx    # Dropdown selection component
│   ├── hello/          # Hello World example page
│   ├── counterpartyfilter/  # Counterparty search filter
│   └── counterpartylist/   # Counterparty list with table view
└── App.css             # Shared styles
```

## Routes

- `/` - Home page
- `/form` - Dynamic form page (generates forms from payload data)
- `/hello` - Hello World example page
- `/counterpartyfilter` - Counterparty search filter form
- `/counterpartylist` - Counterparty list with selectable table

## Features

- **Iframe Communication**: Components receive data via `postMessage` and send responses back to parent windows
- **Dynamic Forms**: FormPage automatically generates form fields based on column definitions
- **Data Tables**: CounterpartyList displays data in a flexible table format
- **Date Picker**: Custom date picker component for date fields

## Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173/ui_components/` (base path configured in `vite.config.js`).
