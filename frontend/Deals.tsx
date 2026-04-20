
import React, { useEffect, useState } from 'react';

const DealsPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // This fetches from your Railway backend
    fetch('https://your-backend-url.railway.app/api/deals')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.log("Error fetching deals:", err));
  }, []);

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#fdfdfd', minHeight: '100vh', fontFamily: '"Inter", sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#1a1a1a', fontSize: '2.5rem', fontWeight: '600', letterSpacing: '-0.02em' }}>
          Exclusive Wholesale Deals
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Premium selections for our Manchester partners at NH Quality Goods.
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {items.map((item, index) => (
          <div key={index} style={{ 
            background: '#ffffff', 
            borderRadius: '16px', 
            padding: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid #f0f0f0',
            transition: 'transform 0.2s ease'
          }}>
            <div style={{ 
              display: 'inline-block', 
              backgroundColor: '#1a1a1a', 
              color: '#fff', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.75rem',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              {item.status || 'TODAY\'S DEAL'}
            </div>
            
            <h3 style={{ fontSize: '1.1rem', color: '#333', marginBottom: '12px', lineHeight: '1.4' }}>
              {item.product_name || item.name}
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
                ${item.price}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#999', textDecoration: 'line-through' }}>
                ${(parseFloat(item.price) + 2.5).toFixed(2)}
              </span>
            </div>

            <button style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#1a1a1a', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}>
              Add to Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsPage;
