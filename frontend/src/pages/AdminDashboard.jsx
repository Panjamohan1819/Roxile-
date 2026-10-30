// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken, getUserRole } from '../utils/auth';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, stores: 0, ratings: 0 });
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dash = await axios.get('/api/admin/dashboard', { headers: { Authorization: `Bearer ${getToken()}` } });
        setStats(dash.data);
        const u = await axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${getToken()}` } });
        setUsers(u.data);
        const s = await axios.get('/api/admin/stores', { headers: { Authorization: `Bearer ${getToken()}` } });
        setStores(s.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/login');
  };

  return (
    <div className="container">
      <header><h2>Admin Dashboard</h2></header>
      <button onClick={logout}>Logout</button>
      <section>
        <h3>Totals</h3>
        <ul>
          <li>Total Users: {stats.users}</li>
          <li>Total Stores: {stats.stores}</li>
          <li>Total Ratings: {stats.ratings}</li>
        </ul>
      </section>
      <section>
        <h3>Users</h3>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Address</th><th>Role</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.address}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Stores</h3>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Address</th></tr></thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
