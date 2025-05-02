import React, { useState, useEffect } from 'react';
import '../styles/Calendar.css';

const Calendar = () => {
  const [date, setDate] = useState(new Date());
  
  useEffect(() => {
    // Update date every minute to ensure it stays current
    const interval = setInterval(() => {
      setDate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const formatMonth = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };
  
  const formatTime = () => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes} ${ampm}`;
  };

  // Get the days in the current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days array
  const generateCalendarDays = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const renderCalendarGrid = () => {
    const days = generateCalendarDays();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = date.getDate();
    
    return (
      <>
        <div className="calendar-header">
          <div className="calendar-month-year">
            {formatMonth()} {date.getFullYear()}
          </div>
          <div className="calendar-time">{formatTime()}</div>
        </div>
        
        <div className="calendar-grid">
          {/* Day headers */}
          {dayNames.map((day, index) => (
            <div key={`header-${index}`} className="calendar-day-header">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => (
            <div 
              key={`day-${index}`} 
              className={`calendar-day-cell ${day === today ? 'today' : ''} ${day === null ? 'empty' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="calendar-overlay">
      {renderCalendarGrid()}
    </div>
  );
};

export default Calendar;