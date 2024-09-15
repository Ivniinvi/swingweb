import React, { useState } from 'react';
import api from '../api';

function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [newTerm, setNewTerm] = useState({ termType: '', name: '', amount: '', validFrom: '', validUntil: '' });
  const [newPassword, setNewPassword] = useState({ type: '', value: '' });

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/auth', { adminPassword });
      setIsAuthenticated(true);
    } catch (error) {
      alert('Authentication failed');
    }
  };

  const handleViewTable = async () => {
    try {
      const response = await api.post('/admin/viewtable', { adminPassword, tableName: selectedTable });
      setTableData(response.data);
    } catch (error) {
      alert('Failed to fetch table data');
    }
  };

  const handleAddTerm = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/addterm', { adminPassword, ...newTerm });
      alert('Term added successfully');
      setNewTerm({ termType: '', name: '', amount: '', validUntil: '' });
    } catch (error) {
      alert('Failed to add term');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/changepassword', { adminPassword, ...newPassword });
      alert('Password changed successfully');
      setNewPassword({ type: '', value: '' });
    } catch (error) {
      alert('Failed to change password');
    }
  };

  if (!isAuthenticated) {
    return (
      <form onSubmit={handleAdminAuth}>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Admin Password"
        />
        <button type="submit">Authenticate</button>
      </form>
    );
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      
      <h2>View Table</h2>
      <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
        <option value="">Select a table</option>
        <option value="members">Members</option>
        <option value="waivers">Waivers</option>
        <option value="payments">Payments</option>
        <option value="signins">Sign-ins</option>
        <option value="warnings">Warnings</option>
      </select>
      <button onClick={handleViewTable}>View Table</button>
      {tableData && (
        <table>
          <thead>
            <tr>
              {Object.keys(tableData[0]).map(key => <th key={key}>{key}</th>)}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => <td key={i}>{value}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Add New Term</h2>
      <form onSubmit={handleAddTerm}>
        <select
          value={newTerm.termType}
          onChange={(e) => setNewTerm({...newTerm, termType: e.target.value})}
        >
          <option value="">Select term type</option>
          <option value="waiver">Waiver</option>
          <option value="payment">Payment</option>
        </select>
        <input
          type="text"
          value={newTerm.name}
          onChange={(e) => setNewTerm({...newTerm, name: e.target.value})}
          placeholder="Term Name"
        />
        {newTerm.termType === 'payment' && (
          <input
            type="number"
            value={newTerm.amount}
            onChange={(e) => setNewTerm({...newTerm, amount: e.target.value})}
            placeholder="Amount"
          />
        )}
        <input
          type="date"
          value={newTerm.validUntil}
          onChange={(e) => setNewTerm({...newTerm, validUntil: e.target.value})}
        />
        <button type="submit">Add Term</button>
      </form>

      <h2>Change Password</h2>
      <form onSubmit={handleChangePassword}>
        <select
          value={newPassword.type}
          onChange={(e) => setNewPassword({...newPassword, type: e.target.value})}
        >
          <option value="">Select password type</option>
          <option value="password">Site Password</option>
          <option value="adminpassword">Admin Password</option>
        </select>
        <input
          type="password"
          value={newPassword.value}
          onChange={(e) => setNewPassword({...newPassword, value: e.target.value})}
          placeholder="New Password"
        />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default AdminPanel;
