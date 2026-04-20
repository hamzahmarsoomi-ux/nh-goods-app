import React, { useEffect, useState } from 'react';

const DealsPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // جلب البيانات من الباك-إند الذي أنشأته في app.py
    fetch('https://your-backend-url.railway.app/api/deals')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#e67e22' }}>🔥 عروض اليوم - NH Quality Goods</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {items.map((item, index) => (
          <div key={index} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
            <img src="https://mclanexpress.com/favicon.ico" alt={item.product} style={{ width: '100px' }} />
            <h3 style={{ fontSize: '16px' }}>{item.product}</h3>
            <p style={{ textDecoration: 'line-through', color: 'gray' }}>${(item.original + 2.5).toFixed(2)}</p>
            <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '20px' }}>${item.price}</p>
            <button style={{ background: '#e67e22', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>
              إضافة للطلب
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsPage;
