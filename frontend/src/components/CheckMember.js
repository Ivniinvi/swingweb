import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { formatPUID } from '../utils/puidFormatter';

function CheckMember() {
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSubmitted, setLastSubmitted] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (textInput.length === 10) {
      handleSubmit();
    }
  }, [textInput]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = async () => {
    if (textInput.length === 0) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setLastSubmitted(textInput);
    try {
      const formattedPUID = formatPUID(textInput);
      const response = await api.post('/checkmember', { puid: formattedPUID });
      setResult(response.data);
    } catch (error) {
      console.error('Query failed:', error);
      setError(error.message || 'Failed to check membership. Please try again.');
    } finally {
      setIsLoading(false);
      setTextInput('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input
    if (/^\d{0,10}$/.test(value)) {
      setTextInput(value);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'warning_issued': return 'orange';
      case 'warning_active': return 'orange';
      case 'warning_expired': return 'red';
      case 'unpaid': return 'orange';
      case 'no_waiver': return 'orange';
      case 'inactive': return 'red';
      case 'not_found': return 'red';
      default: return 'black';
    }
  };

  return (
    <div>
      <h1>Check Membership</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={textInput}
          onChange={handleInputChange}
          placeholder="Enter PUID (10 digits)"
          maxLength={10}
          disabled={isLoading}
          ref={inputRef}
        />
      </form>
      {isLoading && <p>Checking membership...</p>}
      {lastSubmitted && result && (
        <div>
          <h2>PUID: {lastSubmitted}</h2>
          {result.name && <h3>Name: {result.name}</h3>}
          <p style={{ color: getStatusColor(result.status), fontWeight: 'bold' }}>
            {result.message}
          </p>
          {(result.status === 'warning_issued' || result.status === 'warning_active') && (
            <p style={{ color: 'orange', fontWeight: 'bold' }}>
              Member allowed entry this time.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckMember;