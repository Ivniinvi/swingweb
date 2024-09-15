import React, { useState, useEffect } from 'react';
import api from '../api';
import { formatPUID } from '../utils/puidFormatter';

function Payments() {
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [puid, setPuid] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  const fetchPaymentTerms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/paymentterms');
      setTerms(response.data);
    } catch (error) {
      console.error('Failed to fetch payment terms:', error);
      setError('Failed to load payment terms. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTerm || !puid) {
      alert('Please select a term and enter a PUID');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const formattedPUID = formatPUID(puid);
      // Create the payment
      const paymentResponse = await api.post('/payments', {
        termName: selectedTerm,
        puid: formattedPUID,
      });
      setResult(paymentResponse.data);
    } catch (error) {
      console.error('Failed to process payment:', error);
      setError(error.message || 'Failed to process payment. Please try again later.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePuidChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setPuid(value);
    }
  };

  return (
    <div>
      <h1>Payments</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a term</option>
          {terms.map((term) => (
            <option key={term.name} value={term.name}>
              {term.name}: ${term.amount}
            </option>
          ))}
        </select>
        {isLoading && <p>Loading...</p>}
        <input
          type="text"
          value={puid}
          onChange={handlePuidChange}
          placeholder="Enter PUID (numbers only)"
          required
          maxLength={10}
        />
        <button type="submit" disabled={isLoading || !selectedTerm || !puid}>Submit</button>
      </form>
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Payments;