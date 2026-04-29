import React, { useState, useEffect } from 'react';
import { tradingAPI } from '../../services/api';
import './SessionIndicator.css';

const SessionIndicator = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSession = async () => {
    try {
      const response = await tradingAPI.getMarketSummaryEnhanced();
      if (response.data.success && response.data.session) {
        setSession(response.data.session);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="session-indicator-loading">
        <div className="spinner-small"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getSessionIcon = (sessionKey) => {
    const icons = {
      PRE_OPEN: '🌅',
      OPENING: '🔔',
      MORNING: '☀️',
      LUNCH: '🍽️',
      AFTERNOON: '🌤️',
      CLOSING: '🔚',
      PRE_MARKET: '⏰',
      POST_MARKET: '📊'
    };
    return icons[sessionKey] || '📈';
  };

  const getSessionClass = (sessionKey) => {
    const classes = {
      OPENING: 'session-opening',
      MORNING: 'session-morning',
      LUNCH: 'session-lunch',
      AFTERNOON: 'session-afternoon',
      CLOSING: 'session-closing'
    };
    return classes[sessionKey] || '';
  };

  const isMarketOpen = session.isMarketHours && session.isWeekday;

  return (
    <div className={`session-indicator ${getSessionClass(session.key)}`}>
      <div className="session-icon">{getSessionIcon(session.key)}</div>
      <div className="session-info">
        <div className="session-name">{session.label}</div>
        <div className="session-time">{session.formattedTime}</div>
      </div>
      <div className={`session-status ${isMarketOpen ? 'open' : 'closed'}`}>
        {isMarketOpen ? '● LIVE' : '● CLOSED'}
      </div>
    </div>
  );
};

export default SessionIndicator;