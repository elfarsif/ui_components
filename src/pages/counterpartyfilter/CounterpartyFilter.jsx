import { useState, useRef } from 'react'
import '../../App.css'

const countryCodes = [
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'SG', name: 'Singapore' }
]

function CounterpartyFilter() {
  const [counterpartyName, setCounterpartyName] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const blurTimeoutRef = useRef(null)

  const formatAsPlainText = ({ counterpartyName, address }) => {
    const lines = []
    if (counterpartyName) lines.push(`Counterparty Name: ${counterpartyName}`)
    if (address) lines.push(`Address: ${address}`)
    return lines.join('\n')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Append country code to address if country is selected
    let finalAddress = address.trim() || ''
    if (country) {
      finalAddress = finalAddress 
        ? `${finalAddress}, ${country}` 
        : country
    }

    const dataToSend = {
      counterpartyName: counterpartyName.trim() || '',
      address: finalAddress
    }

    // Create LLM payload
    const llmPayload = {
      action: "counterparty_search",
      timestamp: new Date().toISOString(),
      data: {
        ...dataToSend,
        metadata: {
          source: "iframe_component",
          version: "1.0.0"
        }
      }
    }

    // Send data to parent
    window.parent.postMessage(
      {
        type: "ui_component_user_message",
        message: formatAsPlainText(dataToSend), // plain text
        llmMessage: JSON.stringify(llmPayload)
      },
      "*"
    )

    console.log("Data sent to parent:", {
      type: "ui_component_user_message",
      message: dataToSend,
      llmMessage: llmPayload
    })
  }

  return (
    <div className="dropdown-container">
      <div className="data-display">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="counterparty-name">Counterparty Name:</label>
            <input
              id="counterparty-name"
              type="text"
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              placeholder="Enter counterparty name"
              className="form-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="address">Address:</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              className="form-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="country">Country:</label>
            <div className={`searchable-select ${countryOpen ? 'open' : ''}`}>
              <div className="searchable-select__control">
                <input
                  type="text"
                  id="country"
                  className="form-input searchable-select__input"
                  placeholder="Search country"
                  value={country || countrySearch}
                  onFocus={() => {
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                    setCountryOpen(true)
                  }}
                  onChange={(e) => {
                    const next = e.target.value
                    setCountrySearch(next)
                    setCountry(next)
                  }}
                  onBlur={() => {
                    blurTimeoutRef.current = setTimeout(() => setCountryOpen(false), 120)
                  }}
                  autoComplete="off"
                />
                <span className="searchable-select__chevron" aria-hidden="true"></span>
              </div>
              {countryOpen && (
                <div className="searchable-select__menu">
                  {countryCodes
                    .filter(({ name, code }) =>
                      `${name} (${code})`.toLowerCase().includes((countrySearch || '').toLowerCase())
                    )
                    .map((countryOption) => (
                      <div
                        key={countryOption.code}
                        className={`searchable-select__option ${
                          countryOption.code === country ? 'is-selected' : ''
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setCountry(countryOption.code)
                          setCountrySearch(`${countryOption.name} (${countryOption.code})`)
                          setCountryOpen(false)
                        }}
                      >
                        {countryOption.name} ({countryOption.code})
                      </div>
                    ))}
                  {countryCodes.filter(({ name, code }) =>
                    `${name} (${code})`.toLowerCase().includes((countrySearch || '').toLowerCase())
                  ).length === 0 && (
                    <div className="searchable-select__option searchable-select__option--empty">
                      No results
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default CounterpartyFilter
