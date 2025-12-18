import { useState } from 'react'

function CounterpartyFilter() {
  const [counterpartyName, setCounterpartyName] = useState('')
  const [country, setCountry] = useState('')
  const [siteId, setSiteId] = useState('')
  const [address, setAddress] = useState('')
  const [cmrNumber, setCmrNumber] = useState('')
  const [gbgCeid, setGbgCeid] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    const dataToSend = {
      counterpartyName: counterpartyName.trim() || '',
      country: country.trim() || '',
      siteId: siteId.trim() || '',
      address: address.trim() || '',
      cmrNumber: cmrNumber.trim() || '',
      gbgCeid: gbgCeid.trim() || ''
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
        message: JSON.stringify(dataToSend),
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
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="counterparty-name">Counterparty Name:</label>
          <input
            id="counterparty-name"
            type="text"
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder="Enter counterparty name"
          />
        </div>
        <div>
          <label htmlFor="country">Country:</label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Enter country"
          />
        </div>
        <div>
          <label htmlFor="site-id">Site ID:</label>
          <input
            id="site-id"
            type="text"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            placeholder="Enter site ID"
          />
        </div>
        <div>
          <label htmlFor="address">Address:</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />
        </div>
        <div>
          <label htmlFor="cmr-number">CMR Number:</label>
          <input
            id="cmr-number"
            type="text"
            value={cmrNumber}
            onChange={(e) => setCmrNumber(e.target.value)}
            placeholder="Enter CMR number"
          />
        </div>
        <div>
          <label htmlFor="gbg-ceid">GBG CEID:</label>
          <input
            id="gbg-ceid"
            type="text"
            value={gbgCeid}
            onChange={(e) => setGbgCeid(e.target.value)}
            placeholder="Enter GBG CEID"
          />
        </div>
        <button type="submit">
          Submit
        </button>
      </form>
    </div>
  )
}

export default CounterpartyFilter
