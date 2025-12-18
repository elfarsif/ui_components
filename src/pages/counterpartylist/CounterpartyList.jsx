import { useIframeMessages } from './counterpartyListIframeHook'

function CounterpartyList() {
  const { originalData } = useIframeMessages()

  return (
    <div>
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <ul>
          {originalData.rows.map((row, index) => (
            <li key={row.id || index}>
              <strong>{row.name || 'N/A'}</strong>
              {row.cf_cpAddress && (
                <span> - {row.cf_cpAddress}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default CounterpartyList
