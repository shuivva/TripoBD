import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Wishlist() {
  const [searchParams] = useSearchParams()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  
  const userId = searchParams.get('user_id')

  useEffect(() => {
    fetchWishlist()
  }, [userId])

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) setWishlist(data)
    } catch (err) {
      console.error('Failed to fetch wishlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (wishlistId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${wishlistId}/`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setWishlist(wishlist.filter(item => item.id !== wishlistId))
      }
    } catch (err) {
      alert('Failed to remove from wishlist')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <>
      <main className="wishlist-page">
        <div className="wishlist-container">
          <header className="wishlist-header">
            <div>
              <h1>Saved Destinations</h1>
              <p>You have {wishlist.length} saved destinations</p>
            </div>
          </header>

          {wishlist.length > 0 ? (
            <div className="wishlist-grid">
              {wishlist.map(item => (
                <div key={item.id} className="wishlist-item">
                  <div className="wishlist-image">
                    <img src={item.destination_hero || '/placeholder.jpg'} alt={item.destination_name} />
                    <button 
                      className="btn-remove"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="wishlist-info">
                    <h3>{item.destination_name}</h3>
                    <p className="region">{item.destination_region}</p>
                    {item.note && <p className="note">{item.note}</p>}
                    <div className="wishlist-actions">
                      <button className="btn-primary">View Details</button>
                      <button className="btn-secondary">Plan Trip</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">❤️</div>
              <h2>No Saved Destinations</h2>
              <p>Start exploring and save your favorite destinations!</p>
              <button className="btn-primary" onClick={() => window.location.href = '/discover'}>
                Explore Destinations
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wishlist-page{min-height:100vh;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%);padding:2.5rem;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .wishlist-container{max-width:1600px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem}
        .wishlist-header{padding:2rem 2.5rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:2px solid rgba(243,244,246,0.8)}
        .wishlist-header h1{margin:0 0 0.35rem 0;font-size:2rem;font-weight:800;color:#111827;letter-spacing:-0.02em}
        .wishlist-header p{margin:0;color:#6b7280;font-size:0.95rem;font-weight:600}
        .wishlist-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:1.75rem}
        .wishlist-item{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border:2px solid rgba(243,244,246,0.8);border-radius:1.5rem;overflow:hidden;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,0.06);display:flex;flex-direction:column}
        .wishlist-item:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,0.12);border-color:rgba(239,68,68,0.3)}
        .wishlist-image{position:relative;height:220px;overflow:hidden}
        .wishlist-image img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .wishlist-item:hover .wishlist-image img{transform:scale(1.05)}
        .btn-remove{position:absolute;top:1rem;right:1rem;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border:2px solid rgba(239,68,68,0.3);color:#ef4444;font-size:1.2rem;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(239,68,68,0.2);display:flex;align-items:center;justify-content:center}
        .btn-remove:hover{background:#ef4444;color:white;transform:scale(1.1)}
        .wishlist-info{padding:1.75rem;flex:1;display:flex;flex-direction:column}
        .wishlist-info h3{margin:0 0 0.5rem 0;font-size:1.35rem;font-weight:800;color:#111827;letter-spacing:-0.01em}
        .wishlist-info .region{margin:0 0 0.75rem 0;color:#6b7280;font-size:0.9rem;font-weight:600}
        .wishlist-info .note{margin:0 0 1rem 0;color:#9ca3af;font-size:0.85rem;font-style:italic;line-height:1.5}
        .wishlist-actions{display:flex;gap:0.75rem;margin-top:auto}
        .btn-primary{flex:1;padding:0.85rem 1.25rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.9rem;transition:all .3s;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(59,130,246,0.4)}
        .btn-secondary{flex:1;padding:0.85rem 1.25rem;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);color:#374151;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.9rem;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
        .btn-secondary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .empty-state{text-align:center;padding:5rem 2rem;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:1.5rem;border:2px solid rgba(243,244,246,0.8);box-shadow:0 4px 20px rgba(0,0,0,0.06)}
        .empty-icon{font-size:5rem;margin-bottom:1.5rem}
        .empty-state h2{font-size:1.75rem;font-weight:800;color:#111827;margin:0 0 1rem}
        .empty-state p{color:#6b7280;font-size:1.1rem;margin-bottom:2rem}
        .loading{text-align:center;padding:6rem;font-size:1.5rem;color:#6b7280;font-weight:600}

        @media (max-width: 768px) {
          .wishlist-page{padding:1.5rem}
          .wishlist-header{padding:1.5rem}
          .wishlist-header h1{font-size:1.5rem}
          .wishlist-grid{grid-template-columns:1fr}
          .wishlist-image{height:200px}
        }
      `}</style>
    </>
  )
}
