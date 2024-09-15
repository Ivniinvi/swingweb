import React, { useState, useEffect } from 'react';
import api from '../api';
import { formatPUID } from '../utils/puidFormatter';

function Waivers() {
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [puid, setPuid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/terms');
      setTerms(response.data);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      setError('Failed to load terms. Please try again later.');
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
      // First, create or update the member
      const memberResponse = await api.post('/members', {
        puid: formattedPUID,
        name,
        email,
      });
      console.log('Member created/updated:', memberResponse.data);

      // Then, create the waiver
      const waiverResponse = await api.post('/waivers', {
        termName: selectedTerm,
        puid: formattedPUID,
      });
      setResult({
        member: memberResponse.data,
        waiver: waiverResponse.data,
      });
    } catch (error) {
      console.error('Failed to process waiver:', error);
      setError(error.message || 'Failed to process waiver. Please try again later.');
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
      <h1>Waivers</h1>
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
              {term.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={puid}
          onChange={handlePuidChange}
          placeholder="Enter PUID"
          required
          maxLength={10}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Email"
        />
        <button type="submit" disabled={isLoading || !selectedTerm || !puid}>Submit</button>
      </form>
      {isLoading && <p>Processing...</p>}
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Waivers;