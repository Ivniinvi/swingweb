import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/checkmember">Check Membership</Link></li>
        <li><Link to="/waivers">Waivers</Link></li>
        <li><Link to="/payments">Payments</Link></li>
        <li><Link to="/admin">Admin Panel</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;