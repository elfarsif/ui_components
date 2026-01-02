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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!originalData || !originalData.rows || originalData.rows.length === 0) {
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parse expiration dates and filter out nulls
    const contracts = originalData.rows
      .map(row => {
        const expDate = row.expdate
        if (!expDate) return null
        
        // Parse date - handle both "MM-DD-YYYY" and "YYYY-MM-DD" formats
        let date
        if (expDate.includes('-')) {
          const parts = expDate.split('-')
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              date = new Date(expDate) // YYYY-MM-DD format
            } else {
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
        
        return {
          id: row.id,
          contractingParty: row.dyn101208 || 'N/A',
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

        // Draw cell
        const cell = monthGroup.append('rect')
          .attr('x', cellX)
          .attr('y', cellY)
          .attr('width', calendarWidth / 7 - 1)
          .attr('height', calendarContentHeight / 6 - 1)
          .attr('fill', count > 0 ? getColor(contractsOnDay[0]?.daysUntilExpiration || 0) : '#f9fafb')
          .attr('stroke', count > 0 ? '#fff' : '#e5e7eb')
          .attr('stroke-width', count > 0 ? 2 : 1)
          .attr('rx', 2)
          .style('cursor', count > 0 ? 'pointer' : 'default')
          .datum({ contracts: contractsOnDay, date: date })
          .on('mouseenter', function(event, d) {
            if (d.contracts.length > 0) {
              d3.select(this).attr('stroke-width', 3).attr('stroke', '#333')
              setHoveredContract(d.contracts[0]) // Show first contract on hover
              setTooltipPosition({ x: event.clientX, y: event.clientY })
            }
          })
          .on('mousemove', function(event, d) {
            if (d.contracts.length > 0) {
              setTooltipPosition({ x: event.clientX, y: event.clientY })
            }
          })
          .on('mouseleave', function(event, d) {
            if (d.contracts.length > 0) {
              d3.select(this).attr('stroke-width', 2).attr('stroke', '#fff')
              setHoveredContract(null)
            }
          })

        // Day number
        monthGroup.append('text')
          .attr('x', cellX + 4)
          .attr('y', cellY + 14)
          .attr('font-size', '10px')
          .attr('font-weight', count > 0 ? 'bold' : 'normal')
          .attr('fill', count > 0 ? '#fff' : '#666')
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

  }, [originalData, selectedYear])

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
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="year-selector"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <svg ref={svgRef}></svg>
          </div>
          {hoveredContract && (
            <div 
              className="month-tooltip"
              style={{
                left: `${tooltipPosition.x + 10}px`,
                top: `${tooltipPosition.y + 10}px`
              }}
            >
              <div className="tooltip-header">
                <h3>Contract Details</h3>
              </div>
              <div className="tooltip-contracts">
                <div className="tooltip-contract-item">
                  <span className="contract-id">ID: {hoveredContract.id}</span>
                  <span className="contract-party">{hoveredContract.contractingParty}</span>
                  <span className="contract-date">
                    Expires: {hoveredContract.expirationDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span className="contract-days" style={{
                    color: hoveredContract.daysUntilExpiration < 0 ? '#dc2626' :
                           hoveredContract.daysUntilExpiration <= 30 ? '#ef4444' :
                           hoveredContract.daysUntilExpiration <= 90 ? '#f59e0b' :
                           hoveredContract.daysUntilExpiration <= 180 ? '#eab308' :
                           hoveredContract.daysUntilExpiration <= 365 ? '#84cc16' : '#22c55e',
                    fontWeight: 'bold'
                  }}>
                    {hoveredContract.daysUntilExpiration < 0 
                      ? `Expired ${Math.abs(hoveredContract.daysUntilExpiration)} days ago`
                      : `${hoveredContract.daysUntilExpiration} days until expiration`}
                  </span>
                </div>
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
