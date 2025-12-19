import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import '../App.css'
import 'react-day-picker/dist/style.css'

/**
 * Reusable DatePicker component with input field and popover calendar
 * @param {string} value - Date value in YYYY-MM-DD format
 * @param {function} onChange - Callback function that receives date string in YYYY-MM-DD format
 * @param {string} id - Optional id for the date picker
 * @param {string} placeholder - Optional placeholder text
 * @param {string} className - Optional additional className
 */
function DatePicker({ value, onChange, id, placeholder = 'Select date', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [month, setMonth] = useState(value ? new Date(value) : new Date())
  const [popoverStyle, setPopoverStyle] = useState({})
  const wrapperRef = useRef(null)
  const popoverRef = useRef(null)

  const parseDate = (dateString) =>
    dateString ? new Date(`${dateString}T00:00:00`) : undefined

  // Convert string value to Date object (normalize to local midnight to avoid TZ shifts)
  const selectedDate = parseDate(value)

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return ''
    const date = parseDate(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  const formatLocalISODate = (date) => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Handle date selection
  const handleSelect = (date) => {
    const dateString = formatLocalISODate(date)
    onChange(dateString)
    setIsOpen(false) // Close calendar after selection
  }

  const adjustPopoverPosition = useCallback(() => {
    if (!isOpen || !wrapperRef.current) return

    const inputRect = wrapperRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const popoverWidth = popoverRef.current?.offsetWidth || 220

    // Reserve space so dropdowns open downward
    const requiredSpaceBelow = 320
    const defaultTop = inputRect.top + inputRect.height + 4
    const maxTop = Math.max(8, viewportHeight - requiredSpaceBelow)
    const topPosition = Math.min(defaultTop, maxTop)

    const minLeft = 8
    const maxLeft = Math.max(minLeft, viewportWidth - popoverWidth - 8)
    const leftPosition = Math.min(Math.max(inputRect.left, minLeft), maxLeft)

    setPopoverStyle({
      position: 'fixed',
      top: `${topPosition}px`,
      left: `${leftPosition}px`,
      marginTop: 0,
      marginBottom: 0
    })
  }, [isOpen])

  // Adjust popover position to ensure dropdowns open downward
  useEffect(() => {
    if (isOpen) {
      adjustPopoverPosition()
    }
  }, [isOpen, month, adjustPopoverPosition])

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideInput =
        wrapperRef.current && wrapperRef.current.contains(event.target)
      const clickedInsidePopover =
        popoverRef.current && popoverRef.current.contains(event.target)

      if (!clickedInsideInput && !clickedInsidePopover) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', adjustPopoverPosition, true)
      window.addEventListener('resize', adjustPopoverPosition)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', adjustPopoverPosition, true)
      window.removeEventListener('resize', adjustPopoverPosition)
    }
  }, [isOpen, adjustPopoverPosition])

  // Update month when value changes
  useEffect(() => {
    if (value) {
      setMonth(parseDate(value))
    }
  }, [value])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Generate years: 20 years in the past to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 20 + i)

  const handleMonthChange = (e) => {
    const newMonth = new Date(month)
    newMonth.setMonth(parseInt(e.target.value))
    setMonth(newMonth)
  }

  const handleYearChange = (e) => {
    const newMonth = new Date(month)
    newMonth.setFullYear(parseInt(e.target.value))
    setMonth(newMonth)
  }

  return (
    <div className={`date-picker-wrapper ${className}`} ref={wrapperRef} style={{ position: 'relative', zIndex: 9999 }}>
      <div className="date-picker-input-container">
        <svg 
          className="date-picker-icon" 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path 
            d="M12 2.66667H4C2.89543 2.66667 2 3.5621 2 4.66667V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4.66667C14 3.5621 13.1046 2.66667 12 2.66667Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M10.6667 1.33333V4" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M5.33333 1.33333V4" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M2 6.66667H14" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <input
          id={id}
          type="text"
          readOnly
          value={formatDisplayDate(value)}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className="date-picker-input form-input"
        />
      </div>
      {isOpen &&
        createPortal(
          <div className="date-picker-popover" ref={popoverRef} style={popoverStyle}>
            <div className="date-picker-header">
              <button
                type="button"
                className="date-picker-nav-button"
                onClick={() => {
                  const newMonth = new Date(month)
                  newMonth.setMonth(month.getMonth() - 1)
                  setMonth(newMonth)
                }}
                aria-label="Previous month"
              >
                &lt;
              </button>
              <select
                className="date-picker-select"
                value={month.getMonth()}
                onChange={handleMonthChange}
              >
                {months.map((monthName, index) => (
                  <option key={index} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
              <select
                className="date-picker-select date-picker-year-select"
                value={month.getFullYear()}
                onChange={handleYearChange}
                style={{ 
                  direction: 'ltr',
                  position: 'relative',
                  zIndex: 1001
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="date-picker-nav-button"
                onClick={() => {
                  const newMonth = new Date(month)
                  newMonth.setMonth(month.getMonth() + 1)
                  setMonth(newMonth)
                }}
                aria-label="Next month"
              >
                &gt;
              </button>
            </div>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              className="date-picker"
              showOutsideDays
              components={{
                Caption: () => null,
                IconLeft: () => null,
                IconRight: () => null,
              }}
            />
          </div>,
          document.body
        )}
    </div>
  )
}

export default DatePicker

