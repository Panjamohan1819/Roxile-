// src/pages/StoreList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken, getUserRole } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [ratingInputs, setRatingInputs] = useState({}); // {storeId: rating}
  const navigate = useNavigate();

  const fetchStores = async () => {
    try {
      const res = await axios.get('/api/stores', {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: {}, // can add search params later
      });
      setStores(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleRatingChange = (storeId, value) => {
    setRatingInputs(prev => ({ ...prev, [storeId]: value }));
  };

  const submitRating = async store => {
    const rating = parseInt(ratingInputs[store.id]);
    if (!rating) return alert('Select a rating');
    try {
      // first try to create, if 409 or existing we update
      await axios.post(
        '/api/user/ratings',
        { storeId: store.id, rating },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      alert('Rating submitted');
      fetchStores();
    } catch (err) {
      // if already exists, use PUT to update
      if (err.response && err.response.status === 400) {
        // fallback to update using existing rating id (not known here) – try to fetch user rating first
        try {
          const userRatings = await axios.get('/api/user/ratings', { headers: { Authorization: `Bearer ${getToken()}` } });
          const existing = userRatings.data.find(r => r.storeId === store.id);
          if (existing) {
            await axios.put(`/api/user/ratings/${existing.id}`, { rating }, { headers: { Authorization: `Bearer ${getToken()}` } });
            alert('Rating updated');
            fetchStores();
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error(err);
      }
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="container">
      <header>
        <h2>Store List</h2>
        <button onClick={logout}>Logout</button>
      </header>
      {stores.map(store => (
        <div key={store.id} className="store-card">
          <h3>{store.name}</h3>
          <p>{store.address}</p>
          <p>Overall Rating: {store.overallRating ?? 'N/A'}</p>
          {store.userRating && <p>Your Rating: {store.userRating}</p>}
          <div className="rating-form">
            <select
              value={ratingInputs[store.id] || ''}
              onChange={e => handleRatingChange(store.id, e.target.value)}
            >
              <option value="" disabled>Select rating</option>
              {[1, 2, 3, 4, 5].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <button onClick={() => submitRating(store)}>Submit / Update</button>
          </div>
        </div>
      ))}
    </div>
  );
}
