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

  const formatDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };
  
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

  return (
    <div className="calendar-overlay">
      <div className="calendar-day">{formatDayOfWeek()}</div>
      <div className="calendar-date">
        <span className="calendar-month">{formatMonth()}</span>
        <span className="calendar-day-number">{date.getDate()}</span>
      </div>
      <div className="calendar-time">{formatTime()}</div>
    </div>
  );
};

export default Calendar;