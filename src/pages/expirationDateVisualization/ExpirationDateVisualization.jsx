import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useIframeMessages } from './expirationDateVisualizationIframeHook'
import './ExpirationDateVisualization.css'

function ExpirationDateVisualization() {
  const { originalData } = useIframeMessages()
  const svgRef = useRef(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [availableYears, setAvailableYears] = useState([])
  const [hoveredContract, setHoveredContract] = useState(null)
  const [selectedContracts, setSelectedContracts] = useState(null) // Changed to array
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipAbove, setTooltipAbove] = useState(false)

  useEffect(() => {
    if (!originalData || !originalData.rows || originalData.rows.length === 0) {
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parse expiration dates and filter out nulls
    const contracts = originalData.rows
      .map(row => {
        // Support both field names: expdate and expiration_date
        const expDate = row.expdate || row.expiration_date
        if (!expDate) return null
        
        // Parse date - handle both "MM-DD-YYYY" and "YYYY-MM-DD" formats
        let date
        if (expDate.includes('-')) {
          const parts = expDate.split('-')
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              date = new Date(expDate) // YYYY-MM-DD format
            } else {
              // MM-DD-YYYY format
              const month = parseInt(parts[0], 10) - 1
              const day = parseInt(parts[1], 10)
              const year = parseInt(parts[2], 10)
              date = new Date(year, month, day)
            }
          }
        }
        
        if (!date || isNaN(date.getTime())) return null
        
        date.setHours(0, 0, 0, 0)
        const daysUntilExpiration = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
        
        // Support both field names: dyn101208 and contracting_party
        const contractingParty = row.dyn101208 || row.contracting_party || 'N/A'
        
        return {
          id: row.id,
          contractingParty: contractingParty,
          expirationDate: date,
          dateString: expDate,
          daysUntilExpiration: daysUntilExpiration,
          year: date.getFullYear(),
          month: date.getMonth(),
          day: date.getDate()
        }
      })
      .filter(contract => contract !== null)

    if (contracts.length === 0) {
      return
    }

    // Get available years and set default
    const years = [...new Set(contracts.map(c => c.year))].sort()
    setAvailableYears(years)
    if (!selectedYear && years.length > 0) {
      setSelectedYear(years[0])
    }

    if (!selectedYear) return

    // Filter contracts for selected year
    const yearContracts = contracts.filter(c => c.year === selectedYear)

    // Clear previous visualization
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Set up dimensions
    const margin = { top: 80, right: 30, bottom: 30, left: 30 }
    const calendarWidth = 200
    const calendarHeight = 180
    const calendarSpacing = 20
    const cols = 4
    const rows = 3
    
    const totalWidth = cols * calendarWidth + (cols - 1) * calendarSpacing + margin.left + margin.right
    const totalHeight = rows * calendarHeight + (rows - 1) * calendarSpacing + margin.top + margin.bottom

    // Create main group
    const g = svg
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Group contracts by month and day
    const monthData = new Map()
    for (let month = 0; month < 12; month++) {
      const monthContracts = yearContracts.filter(c => c.month === month)
      const dayMap = new Map()
      
      monthContracts.forEach(contract => {
        const day = contract.day
        if (!dayMap.has(day)) {
          dayMap.set(day, [])
        }
        dayMap.get(day).push(contract)
      })
      
      monthData.set(month, {
        contracts: monthContracts,
        dayMap: dayMap,
        monthDate: new Date(selectedYear, month, 1)
      })
    }

    // Color scale based on urgency
    const getColor = (days) => {
      if (days < 0) return '#dc2626' // Expired - dark red
      if (days <= 30) return '#ef4444' // Very soon - red
      if (days <= 90) return '#f59e0b' // Soon - orange
      if (days <= 180) return '#eab308' // Medium - yellow
      if (days <= 365) return '#84cc16' // Far - light green
      return '#22c55e' // Very far - green
    }

    // Draw calendar for each month
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    monthData.forEach((data, month) => {
      const col = month % cols
      const row = Math.floor(month / cols)
      const x = col * (calendarWidth + calendarSpacing)
      const y = row * (calendarHeight + calendarSpacing)

      const monthGroup = g.append('g')
        .attr('transform', `translate(${x},${y})`)

      // Calendar dimensions
      const cellSize = 20
      const headerHeight = 40
      const dayHeaderHeight = 20
      const calendarContentHeight = calendarHeight - headerHeight - dayHeaderHeight

      // Draw calendar background
      monthGroup.append('rect')
        .attr('width', calendarWidth)
        .attr('height', calendarHeight)
        .attr('fill', '#fff')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 2)
        .attr('rx', 4)

      // Month header
      monthGroup.append('text')
        .attr('x', calendarWidth / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(monthNames[month])

      // Day headers
      dayNames.forEach((dayName, i) => {
        monthGroup.append('text')
          .attr('x', (i + 0.5) * (calendarWidth / 7))
          .attr('y', headerHeight + 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('fill', '#666')
          .text(dayName)
      })

      // Get first day of month and number of days
      const firstDay = new Date(selectedYear, month, 1)
      const lastDay = new Date(selectedYear, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const firstDayOfWeek = firstDay.getDay()

      // Draw calendar cells
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, month, day)
        const dayOfWeek = date.getDay()
        const week = Math.floor((day + firstDayOfWeek - 1) / 7)
        
        const cellX = dayOfWeek * (calendarWidth / 7)
        const cellY = headerHeight + dayHeaderHeight + week * (calendarContentHeight / 6)

        const contractsOnDay = data.dayMap.get(day) || []
        const count = contractsOnDay.length

        // Check if this cell contains the selected contracts
        const isSelected = selectedContracts && contractsOnDay.length > 0 && 
          contractsOnDay[0].dateString === selectedContracts[0]?.dateString
        
        // Draw cell
        const cell = monthGroup.append('rect')
          .attr('x', cellX)
          .attr('y', cellY)
          .attr('width', calendarWidth / 7 - 1)
          .attr('height', calendarContentHeight / 6 - 1)
          .attr('fill', count > 0 ? getColor(contractsOnDay[0]?.daysUntilExpiration || 0) : '#f9fafb')
          .attr('stroke', isSelected ? '#333' : (count > 0 ? '#fff' : '#e5e7eb'))
          .attr('stroke-width', isSelected ? 4 : (count > 0 ? 2 : 1))
          .attr('rx', 2)
          .style('cursor', count > 0 ? 'pointer' : 'default')
          .attr('data-contract-cell', count > 0 ? 'true' : 'false')
          .datum({ contracts: contractsOnDay, date: date })
          .on('mouseenter', function(event, d) {
            if (d.contracts.length > 0) {
              const isSelected = selectedContracts && d.contracts.length > 0 && 
                d.contracts[0].dateString === selectedContracts[0]?.dateString
              if (!isSelected) {
                d3.select(this).attr('stroke-width', 3).attr('stroke', '#333')
              }
              if (!selectedContracts) {
                // Check if month is in bottom row (September-December, months 8-11)
                const isBottomRow = month >= 8
                setTooltipAbove(isBottomRow)
                setHoveredContract(d.contracts[0]) // Show first contract on hover
                setTooltipPosition({ x: event.clientX, y: event.clientY })
              }
            }
          })
          .on('mousemove', function(event, d) {
            if (d.contracts.length > 0 && !selectedContracts) {
              const isBottomRow = month >= 8
              setTooltipAbove(isBottomRow)
              setTooltipPosition({ x: event.clientX, y: event.clientY })
            }
          })
          .on('mouseleave', function(event, d) {
            if (d.contracts.length > 0) {
              const isSelected = selectedContracts && d.contracts.length > 0 && 
                d.contracts[0].dateString === selectedContracts[0]?.dateString
              if (!isSelected) {
                d3.select(this).attr('stroke-width', 2).attr('stroke', '#fff')
              }
              if (!selectedContracts) {
                setHoveredContract(null)
              }
            }
          })
          .on('click', function(event, d) {
            event.stopPropagation()
            if (d.contracts.length > 0) {
              const isSelected = selectedContracts && d.contracts.length > 0 && 
                d.contracts[0].dateString === selectedContracts[0]?.dateString
              if (isSelected) {
                // Clicking the same date deselects it
                setSelectedContracts(null)
                setHoveredContract(null)
                d3.select(this).attr('stroke-width', 2).attr('stroke', '#fff')
              } else {
                // Check if month is in bottom row (September-December, months 8-11)
                const isBottomRow = month >= 8
                setTooltipAbove(isBottomRow)
                // Select all contracts for this date
                setSelectedContracts(d.contracts)
                setHoveredContract(d.contracts[0])
                setTooltipPosition({ x: event.clientX, y: event.clientY })
                d3.select(this).attr('stroke-width', 4).attr('stroke', '#333')
              }
            }
          })

        // Day number
        monthGroup.append('text')
          .attr('x', cellX + 4)
          .attr('y', cellY + 14)
          .attr('font-size', '10px')
          .attr('font-weight', count > 0 ? 'bold' : 'normal')
          .attr('fill', count > 0 ? '#fff' : '#666')
          .style('pointer-events', 'none')
          .text(day)

      }
    })

    // Add title
    g.append('text')
      .attr('x', (cols * calendarWidth + (cols - 1) * calendarSpacing) / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '28px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(`Contract Expiration Calendar - ${selectedYear}`)

    // Add summary stats
    const totalContracts = yearContracts.length
    const expiredCount = yearContracts.filter(c => c.daysUntilExpiration < 0).length
    const urgentCount = yearContracts.filter(c => c.daysUntilExpiration >= 0 && c.daysUntilExpiration <= 90).length
    
    g.append('text')
      .attr('x', 0)
      .attr('y', -20)
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text(`Total Contracts: ${totalContracts} | Expired: ${expiredCount} | Urgent (≤90 days): ${urgentCount}`)

  }, [originalData, selectedYear, selectedContracts])

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedContracts) {
        const target = event.target
        const isTooltip = target.closest('.month-tooltip')
        const isContractCell = target.closest('rect[data-contract-cell="true"]') || target.tagName === 'rect'
        const isYearSelector = target.closest('.year-selector-inline')
        
        if (!isTooltip && !isContractCell && !isYearSelector) {
          setSelectedContracts(null)
          setHoveredContract(null)
        }
      }
    }

    if (selectedContracts) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [selectedContracts])

  return (
    <div className="expiration-visualization-container">
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <>
          <div className="visualization-wrapper">
            <div className="year-selector-inline">
              <label htmlFor="year-select" className="year-selector-label">
                Year:
              </label>
              <select
                id="year-select"
                value={selectedYear || ''}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value))
                  setSelectedContracts(null)
                  setHoveredContract(null)
                }}
                className="year-selector"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="open-new-tab-button"
              onClick={() => {
                window.open('https://en.wikipedia.org/wiki/Main_Page', '_blank', 'noopener,noreferrer')
              }}
            >
              Open in new tab (parent)
            </button>
            <svg ref={svgRef}></svg>
          </div>
          {(hoveredContract || selectedContracts) && (
            <div 
              className="month-tooltip"
              style={{
                left: `${tooltipPosition.x + 10}px`,
                top: tooltipAbove 
                  ? `${tooltipPosition.y - 10}px` 
                  : `${tooltipPosition.y + 10}px`,
                transform: tooltipAbove ? 'translateY(-100%)' : 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tooltip-header">
                <h3>
                  {selectedContracts 
                    ? `${selectedContracts.length} Contract${selectedContracts.length !== 1 ? 's' : ''} - ${selectedContracts[0].expirationDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : 'Contract Details'}
                </h3>
              </div>
              <div className="tooltip-contracts">
                {(selectedContracts || [hoveredContract]).map((contract, idx) => (
                  <div 
                    key={idx} 
                    className="tooltip-contract-item"
                    onClick={() => {
                      // Send message to parent to open link when contract item is clicked
                      window.parent.postMessage(
                        {
                          type: 'ui_component_open_link',
                          url: 'https://en.wikipedia.org/wiki/Main_Page'
                        },
                        '*'
                      )
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="contract-id">ID: {contract.id}</span>
                    <span className="contract-party">{contract.contractingParty}</span>
                    <span className="contract-date">
                      Expires: {contract.expirationDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="contract-days" style={{
                      color: contract.daysUntilExpiration < 0 ? '#dc2626' :
                             contract.daysUntilExpiration <= 30 ? '#ef4444' :
                             contract.daysUntilExpiration <= 90 ? '#f59e0b' :
                             contract.daysUntilExpiration <= 180 ? '#eab308' :
                             contract.daysUntilExpiration <= 365 ? '#84cc16' : '#22c55e',
                      fontWeight: 'bold'
                    }}>
                      {contract.daysUntilExpiration < 0 
                        ? `Expired ${Math.abs(contract.daysUntilExpiration)} days ago`
                        : `${contract.daysUntilExpiration} days until expiration`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="waiting-message">Waiting for data from parent window...</p>
      )}
    </div>
  )
}

export default ExpirationDateVisualization
