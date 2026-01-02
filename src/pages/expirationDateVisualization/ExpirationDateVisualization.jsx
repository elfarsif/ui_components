import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useIframeMessages } from './expirationDateVisualizationIframeHook'
import './ExpirationDateVisualization.css'

function ExpirationDateVisualization() {
  const { originalData } = useIframeMessages()
  const svgRef = useRef(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Helper function to get week of month (1-5)
  const getWeekOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstDayOfWeek = firstDay.getDay()
    const dayOfMonth = date.getDate()
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7)
  }

  useEffect(() => {
    if (!originalData || !originalData.rows || originalData.rows.length === 0) {
      return
    }

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
            // Check if first part is 4 digits (YYYY-MM-DD format)
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
        
        return {
          id: row.id,
          contractingParty: row.dyn101208 || 'N/A',
          expirationDate: date,
          dateString: expDate,
          month: d3.timeFormat('%Y-%m')(date),
          weekOfMonth: getWeekOfMonth(date)
        }
      })
      .filter(contract => contract !== null)

    if (contracts.length === 0) {
      return
    }

    // Clear previous visualization
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Set up dimensions
    const margin = { top: 100, right: 30, bottom: 80, left: 100 }
    const width = 1400 - margin.left - margin.right
    const height = 600 - margin.top - margin.bottom

    // Create main group
    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get date range
    const dates = contracts.map(c => c.expirationDate)
    const minDate = d3.min(dates)
    const maxDate = d3.max(dates)
    
    // Get all months in range
    const months = []
    d3.timeMonths(
      new Date(minDate.getFullYear(), minDate.getMonth(), 1),
      new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1)
    ).forEach(monthStart => {
      const monthKey = d3.timeFormat('%Y-%m')(monthStart)
      months.push({
        start: monthStart,
        key: monthKey,
        label: d3.timeFormat('%b %Y')(monthStart)
      })
    })

    // Group contracts by month and week
    const heatmapData = new Map()
    contracts.forEach(contract => {
      const key = `${contract.month}-week${contract.weekOfMonth}`
      if (!heatmapData.has(key)) {
        heatmapData.set(key, {
          month: contract.month,
          weekOfMonth: contract.weekOfMonth,
          contracts: [],
          monthStart: new Date(contract.expirationDate.getFullYear(), contract.expirationDate.getMonth(), 1)
        })
      }
      heatmapData.get(key).contracts.push(contract)
    })

    // Calculate dimensions
    const numMonths = months.length
    const numWeeks = 5 // Maximum weeks in a month
    const cellWidth = width / numMonths
    const cellHeight = height / numWeeks

    // Color scale based on count
    const maxCount = d3.max(Array.from(heatmapData.values()).map(d => d.contracts.length))
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, Math.max(maxCount, 1)])

    // Create scales
    const xScale = d3.scaleBand()
      .domain(months.map(m => m.key))
      .range([0, width])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(d3.range(1, numWeeks + 1))
      .range([0, height])
      .padding(0.05)

    // Draw heatmap cells
    months.forEach(month => {
      for (let week = 1; week <= numWeeks; week++) {
        const key = `${month.key}-week${week}`
        const data = heatmapData.get(key)
        const count = data ? data.contracts.length : 0

        const x = xScale(month.key)
        const y = yScale(week)

        // Draw cell
        const cell = g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', count > 0 ? colorScale(count) : '#f5f5f5')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('rx', 3)
          .style('cursor', count > 0 ? 'pointer' : 'default')
          .on('mouseenter', function(event) {
            if (count > 0 && data) {
              d3.select(this).attr('stroke-width', 3).attr('stroke', '#333')
              setHoveredCell(data)
              setTooltipPosition({ x: event.pageX, y: event.pageY })
            }
          })
          .on('mouseleave', function() {
            d3.select(this).attr('stroke-width', 1).attr('stroke', '#fff')
            setHoveredCell(null)
          })

        // Add count label if > 0
        if (count > 0) {
          g.append('text')
            .attr('x', x + xScale.bandwidth() / 2)
            .attr('y', y + yScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', Math.min(xScale.bandwidth(), yScale.bandwidth()) * 0.25)
            .attr('font-weight', 'bold')
            .attr('fill', count > maxCount / 2 ? '#fff' : '#333')
            .text(count)
        }
      }
    })

    // Add X axis (months)
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => {
        const month = months.find(m => m.key === d)
        return month ? month.label : d
      }))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .attr('font-size', '11px')

    // Add Y axis (weeks)
    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `Week ${d}`))
      .selectAll('text')
      .attr('font-size', '12px')

    // Add title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '28px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Contract Expiration Heatmap')

    // Add axis labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 60)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text('Month')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text('Week of Month')

    // Add legend
    const legendWidth = 300
    const legendHeight = 25
    const legendX = width - legendWidth - 20
    const legendY = -80

    const legendG = g.append('g')
      .attr('transform', `translate(${legendX},${legendY})`)

    const legendSteps = 50
    const legendData = d3.range(0, maxCount + 1, maxCount / legendSteps)
    
    legendG.selectAll('.legend-cell')
      .data(legendData)
      .enter()
      .append('rect')
      .attr('x', (d, i) => (i / legendData.length) * legendWidth)
      .attr('width', legendWidth / legendData.length)
      .attr('height', legendHeight)
      .attr('fill', d => colorScale(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)

    // Legend axis
    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, legendWidth])

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => Math.round(d))

    legendG.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#666')

    legendG.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', '500')
      .attr('fill', '#666')
      .text('Number of Contracts Expiring')

    // Add summary stats
    const totalContracts = contracts.length
    const activeCells = Array.from(heatmapData.values()).filter(d => d.contracts.length > 0).length
    
    g.append('text')
      .attr('x', 0)
      .attr('y', -30)
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .text(`Total Contracts: ${totalContracts} | Active Periods: ${activeCells}`)

  }, [originalData])

  return (
    <div className="expiration-visualization-container">
      {originalData && originalData.rows && originalData.rows.length > 0 ? (
        <>
          <div className="visualization-wrapper">
            <svg ref={svgRef}></svg>
          </div>
          {hoveredCell && hoveredCell.contracts.length > 0 && (
            <div 
              className="month-tooltip"
              style={{
                left: `${tooltipPosition.x + 20}px`,
                top: `${tooltipPosition.y + 20}px`
              }}
            >
              <div className="tooltip-header">
                <h3>
                  {d3.timeFormat('%B %Y')(hoveredCell.monthStart)} - Week {hoveredCell.weekOfMonth}
                </h3>
                <span className="tooltip-count">{hoveredCell.contracts.length} contract{hoveredCell.contracts.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="tooltip-contracts">
                {hoveredCell.contracts.map((contract, idx) => (
                  <div key={idx} className="tooltip-contract-item">
                    <span className="contract-id">{contract.id}</span>
                    <span className="contract-party">{contract.contractingParty}</span>
                    <span className="contract-date">
                      {contract.expirationDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
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
