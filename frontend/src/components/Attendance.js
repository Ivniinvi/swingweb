import React, { useState } from 'react';
import api from '../api';

function Attendance() {
  const [date, setDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState('');

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.post('/admin/attendance', { date }, {
        headers: { 'Content-Type': 'application/json' },
      });
      setAttendanceData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to fetch attendance data');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Attendance</h2>
      <div className="mb-4">
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="border rounded p-2 mr-2"
        />
        <button
          onClick={fetchAttendance}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Fetch Attendance
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {attendanceData.length > 0 && (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">PUID</th>
              <th className="border p-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((entry, index) => (
              <tr key={index}>
                <td className="border p-2">{entry.name}</td>
                <td className="border p-2">{entry.puid}</td>
                <td className="border p-2">{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Attendance;
