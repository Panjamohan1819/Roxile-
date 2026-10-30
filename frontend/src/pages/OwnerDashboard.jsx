// src/pages/OwnerDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function OwnerDashboard() {
  const [ratings, setRatings] = useState([]);
  const [average, setAverage] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [ratingsRes, avgRes] = await Promise.all([
        axios.get('/api/owner/ratings', { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get('/api/owner/average-rating', { headers: { Authorization: `Bearer ${getToken()}` } })
      ]);
      setRatings(ratingsRes.data);
      setAverage(avgRes.data.averageRating);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="container">
      <header>
        <h2>Owner Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </header>
      <section>
        <h3>Average Rating: {average ?? 'N/A'}</h3>
      </section>
      <section>
        <h3>Ratings submitted by users</h3>
        <table>
          <thead>
            <tr><th>User</th><th>Rating</th></tr>
          </thead>
          <tbody>
            {ratings.map(r => (
              <tr key={r.id}>
                <td>{r.User?.name || r.userId}</td>
                <td>{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
