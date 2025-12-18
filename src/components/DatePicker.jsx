import { useState, useRef, useEffect } from 'react'
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

  // Convert string value to Date object
  const selectedDate = value ? new Date(value) : undefined

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  // Handle date selection
  const handleSelect = (date) => {
    const dateString = date ? date.toISOString().split('T')[0] : ''
    onChange(dateString)
    setIsOpen(false) // Close calendar after selection
  }

  // Adjust popover position to ensure dropdowns open downward
  useEffect(() => {
    if (isOpen && popoverRef.current && wrapperRef.current) {
      const inputRect = wrapperRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - inputRect.bottom
      
      // Need at least 350px below for dropdowns to open downward
      // If not enough space, use fixed positioning to ensure space
      if (spaceBelow < 350) {
        const topPosition = inputRect.top + inputRect.height + 4
        setPopoverStyle({ 
          position: 'fixed',
          top: `${topPosition}px`,
          left: `${inputRect.left}px`,
          marginTop: 0,
          marginBottom: 0
        })
      } else {
        setPopoverStyle({
          position: 'absolute',
          top: '100%',
          bottom: 'auto',
          left: 0,
          marginTop: '0.25rem',
          marginBottom: 0
        })
      }
    }
  }, [isOpen, month])

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const recalculatePosition = () => {
      if (isOpen && popoverRef.current && wrapperRef.current) {
        const inputRect = wrapperRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - inputRect.bottom
        
        if (spaceBelow < 350) {
          const topPosition = inputRect.top + inputRect.height + 4
          setPopoverStyle({ 
            position: 'fixed',
            top: `${topPosition}px`,
            left: `${inputRect.left}px`,
            marginTop: 0,
            marginBottom: 0
          })
        } else {
          setPopoverStyle({
            position: 'absolute',
            top: '100%',
            bottom: 'auto',
            left: 0,
            marginTop: '0.25rem',
            marginBottom: 0
          })
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', recalculatePosition, true)
      window.addEventListener('resize', recalculatePosition)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', recalculatePosition, true)
      window.removeEventListener('resize', recalculatePosition)
    }
  }, [isOpen])

  // Update month when value changes
  useEffect(() => {
    if (value) {
      setMonth(new Date(value))
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
      {isOpen && (
        <>
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
        </div>
        </>
      )}
    </div>
  )
}

export default DatePicker

