import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GroupCard from '../components/GroupCard'
import {
  getOpenTourGroups,
  getMyTourGroups,
  getCommunityFeed,
  createOpenTourGroup,
  joinOpenTourGroup,
  createCommunityPost,
  togglePostLike,
  getPostComments,
  addPostComment,
  toggleFollowTraveler,
  getDestinations,
} from '../apiClient'
import './community.css'

const TABS = [
  { id: 'browse', label: '🧭 Browse Groups' },
  { id: 'my',     label: '👥 My Groups' },
  { id: 'feed',   label: '📰 Community Feed' },
  { id: 'create', label: '✨ Create Group' },
]

const emptyGroupForm = {
  name: '',
  description: '',
  destination_slug: '',
  start_date: '',
  end_date: '',
  max_members: 10,
  join_type: 'open',
  fee_type: 'free',
  membership_fee: 0,
  contact_method: 'app',
  contact_value: '',
  itinerary: [{ day_number: 1, title: '', description: '' }],
}

export default function TravelerCommunity() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = useMemo(() => localStorage.getItem('userId'), [])
  const activeTab = searchParams.get('tab') || 'browse'

  const [groups, setGroups]         = useState([])
  const [myGroups, setMyGroups]     = useState({ organized: [], joined: [] })
  const [feed, setFeed]             = useState([])
  const [destinations, setDestinations] = useState([])
  const [filters, setFilters]       = useState({
    destination: '', date_from: '', date_to: '',
    min_size: '', max_size: '', fee_type: '', search: '',
  })
  const [feedFilter, setFeedFilter] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [message, setMessage]       = useState('')
  const [joiningId, setJoiningId]   = useState(null)
  const [groupForm, setGroupForm]   = useState(emptyGroupForm)
  const [postForm, setPostForm]     = useState({ post_type: 'tip', title: '', content: '', image_url: '' })
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments]     = useState({})
  const [commentDraft, setCommentDraft] = useState({})

  const setTab = (tab) => setSearchParams({ tab })

  const loadGroups = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const data = await getOpenTourGroups(params, userId)
      setGroups(data)
    } catch {
      setError('Could not load tour groups.')
    } finally {
      setLoading(false)
    }
  }, [userId, filters])

  const loadMyGroups = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getMyTourGroups(userId)
      setMyGroups(data)
    } catch {
      setError('Could not load your groups.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadFeed = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const params = feedFilter ? { post_type: feedFilter } : {}
      const data = await getCommunityFeed(params, userId)
      setFeed(data)
    } catch {
      setError('Could not load community feed.')
    } finally {
      setLoading(false)
    }
  }, [userId, feedFilter])

  useEffect(() => {
    getDestinations().then(setDestinations).catch(() => {})
  }, [])

  useEffect(() => {
    if (!userId) { setError('Please sign in to use the community.'); return }
    if (activeTab === 'browse') loadGroups()
    else if (activeTab === 'my') loadMyGroups()
    else if (activeTab === 'feed') loadFeed()
  }, [activeTab, userId, loadGroups, loadMyGroups, loadFeed])

  const handleJoin = async (groupId) => {
    setJoiningId(groupId)
    setMessage('')
    try {
      const res = await joinOpenTourGroup(groupId, userId)
      setMessage(res.message)
      loadGroups()
    } catch (e) {
      setMessage(e.message)
    } finally {
      setJoiningId(null)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const payload = {
        ...groupForm,
        user_id: userId,
        membership_fee: groupForm.fee_type === 'paid' ? groupForm.membership_fee : 0,
        itinerary: groupForm.itinerary.filter((i) => i.title.trim()),
      }
      await createOpenTourGroup(payload)
      setGroupForm(emptyGroupForm)
      setMessage('Group created successfully!')
      setTab('my')
    } catch (e) {
      setMessage(e.message)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!postForm.content.trim()) { setMessage('Please write something before posting.'); return }
    const imageUrl = postForm.image_url.trim()
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      setMessage('Image URL must start with http:// or https://')
      return
    }
    try {
      await createCommunityPost({ ...postForm, user_id: userId })
      setPostForm({ post_type: 'tip', title: '', content: '', image_url: '' })
      setMessage('Post shared successfully!')
      loadFeed()
    } catch (err) {
      setMessage(err.message || 'Failed to create post')
    }
  }

  const handleLike = async (post) => {
    try {
      const res = await togglePostLike(post.id, userId)
      setFeed((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p)
      )
    } catch { /* ignore */ }
  }

  const handleFollow = async (post) => {
    try {
      const follow = !post.following_author
      await toggleFollowTraveler(userId, post.author.id, follow)
      setFeed((prev) =>
        prev.map((p) => p.author.id === post.author.id ? { ...p, following_author: follow } : p)
      )
    } catch { /* ignore */ }
  }

  const toggleComments = async (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); return }
    setExpandedPost(postId)
    if (!comments[postId]) {
      const data = await getPostComments(postId, userId)
      setComments((c) => ({ ...c, [postId]: data }))
    }
  }

  const submitComment = async (postId) => {
    const text = commentDraft[postId]
    if (!text?.trim()) return
    const c = await addPostComment(postId, userId, text)
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), c] }))
    setCommentDraft((d) => ({ ...d, [postId]: '' }))
    setFeed((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    )
  }

  if (!userId) {
    return (
      <main className="page-shell community-page">
        <p className="community-error">Please sign in to access Tour Groups &amp; Community.</p>
        <button type="button" className="button button-primary" onClick={() => navigate('/signin')}>
          Sign In
        </button>
      </main>
    )
  }

  return (
    <main className="page-shell community-page">
      {error && <div className="community-error">{error}</div>}
      {message && <div className="community-message">{message}</div>}

      <header className="community-header">
        <h1>Tour Groups &amp; Community</h1>
        <p>Find travel buddies, join open groups, and share your journey.</p>
      </header>

      {/* Tab Nav */}
      <nav className="community-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={activeTab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Browse Groups ── */}
      {activeTab === 'browse' && (
        <section className="comm-tab-section">
          <div className="comm-tab-header">
            <div>
              <h2 className="comm-tab-title">Browse Open Groups</h2>
              <p className="comm-tab-sub">Find travel buddies and join upcoming group trips across Bangladesh.</p>
            </div>
          </div>

          <form className="community-filters" onSubmit={(e) => { e.preventDefault(); loadGroups() }}>
            <input placeholder="Search groups…" value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            <select value={filters.destination}
              onChange={(e) => setFilters((f) => ({ ...f, destination: e.target.value }))}>
              <option value="">All destinations</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
            <input type="date" value={filters.date_from}
              onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
            <input type="date" value={filters.date_to}
              onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
            <input type="number" placeholder="Min size" value={filters.min_size}
              onChange={(e) => setFilters((f) => ({ ...f, min_size: e.target.value }))} />
            <input type="number" placeholder="Max size" value={filters.max_size}
              onChange={(e) => setFilters((f) => ({ ...f, max_size: e.target.value }))} />
            <select value={filters.fee_type}
              onChange={(e) => setFilters((f) => ({ ...f, fee_type: e.target.value }))}>
              <option value="">Any fee</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            <button type="submit" className="button button-primary">Filter</button>
          </form>

          {loading ? (
            <p className="community-muted">Loading groups…</p>
          ) : groups.length === 0 ? (
            <div className="comm-empty"><span>🔍</span><p>No open groups match your filters.</p></div>
          ) : (
            <div className="groups-grid">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} joining={joiningId === g.id} onJoin={handleJoin} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── My Groups ── */}
      {activeTab === 'my' && (
        <section className="comm-tab-section">
          <div className="comm-tab-header">
            <div>
              <h2 className="comm-tab-title">My Groups</h2>
              <p className="comm-tab-sub">Groups you have organised or joined.</p>
            </div>
            <button type="button" className="button button-primary" onClick={() => setTab('create')}>
              + Create Group
            </button>
          </div>

          {loading ? (
            <p className="community-muted">Loading…</p>
          ) : (
            <>
              <h2 className="section-title">Groups I Organised</h2>
              {myGroups.organized?.length === 0 ? (
                <div className="comm-empty"><span>📋</span><p>You have not created any groups yet.</p></div>
              ) : (
                <div className="groups-grid">
                  {myGroups.organized.map((g) => <GroupCard key={g.id} group={g} />)}
                </div>
              )}
              <h2 className="section-title">Groups I Joined</h2>
              {myGroups.joined?.length === 0 ? (
                <div className="comm-empty"><span>🤝</span><p>You have not joined any groups yet.</p></div>
              ) : (
                <div className="groups-grid">
                  {myGroups.joined.map((g) => (
                    <GroupCard key={g.id} group={{ ...g, user_membership_status: 'joined' }} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Community Feed ── */}
      {activeTab === 'feed' && (
        <section className="feed-layout">
          {/* Sidebar: Composer */}
          <div className="feed-sidebar">
            <div className="composer-card">
              <div className="composer-head">
                <span className="composer-icon">✍️</span>
                <div>
                  <h3 className="composer-title">Share with Community</h3>
                  <p className="composer-sub">Inspire fellow travelers across Bangladesh</p>
                </div>
              </div>

              {/* Post type toggle */}
              <div className="composer-type-row">
                {[
                  { value: 'story', icon: '📖', label: 'Story' },
                  { value: 'photo', icon: '📸', label: 'Photo' },
                  { value: 'tip',   icon: '💡', label: 'Tip'   },
                ].map((t) => (
                  <button
                    key={t.value} type="button"
                    className={`composer-type-btn${postForm.post_type === t.value ? ' composer-type-active' : ''}`}
                    onClick={() => setPostForm((p) => ({ ...p, post_type: t.value }))}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <form className="composer-form" onSubmit={handleCreatePost}>
                <div className="form-group">
                  <label className="form-label">✏️ Title</label>
                  <input
                    className="form-control"
                    placeholder={
                      postForm.post_type === 'story' ? "e.g. Sunrise at Cox's Bazar…" :
                      postForm.post_type === 'photo' ? 'Caption for your photo…' :
                      'e.g. Best time to visit Sajek…'
                    }
                    value={postForm.title}
                    onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    {postForm.post_type === 'story' ? '📝 Your Story' :
                     postForm.post_type === 'photo' ? '📝 Description' : '💡 Your Tip'}
                  </label>
                  <textarea
                    className="form-control" rows={4}
                    placeholder={
                      postForm.post_type === 'story' ? 'Tell us about your journey…' :
                      postForm.post_type === 'photo' ? "What's happening in this photo?" :
                      'Share a helpful tip for other travelers…'
                    }
                    value={postForm.content}
                    onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))}
                    required
                  />
                </div>

                {postForm.post_type === 'photo' && (
                  <div className="form-group">
                    <label className="form-label">🔗 Image URL</label>
                    <input
                      className="form-control" placeholder="https://…"
                      value={postForm.image_url}
                      onChange={(e) => setPostForm((p) => ({ ...p, image_url: e.target.value }))}
                    />
                  </div>
                )}

                <button type="submit" className="button button-primary" style={{marginTop: '0.5rem', width: '100%'}}>🚀 Share Post</button>
              </form>
            </div>

            {/* Feed Filters */}
            <div className="composer-filters">
              <p className="composer-filter-label">Filter by type</p>
              <div className="composer-filter-row">
                {[
                  { val: '',      icon: '🌐', label: 'All'     },
                  { val: 'story', icon: '📖', label: 'Stories' },
                  { val: 'photo', icon: '📸', label: 'Photos'  },
                  { val: 'tip',   icon: '💡', label: 'Tips'    },
                ].map((f) => (
                  <button
                    key={f.val} type="button"
                    className={`composer-chip${feedFilter === f.val ? ' composer-chip-active' : ''}`}
                    onClick={() => setFeedFilter(f.val)}
                  >
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feed Posts */}
          <div className="feed-main">
            {loading ? (
              <p className="community-muted">Loading feed…</p>
            ) : feed.length === 0 ? (
              <div className="comm-empty"><span>📰</span><p>No posts yet. Be the first to share!</p></div>
            ) : (
              feed.map((post) => (
                <article key={post.id} className="feed-post">
                  <div className="post-header">
                    <div className="post-author-avatar">
                      {post.author.avatar_url
                        ? <img src={post.author.avatar_url} alt="" />
                        : <span>{post.author.avatar_initials}</span>
                      }
                    </div>
                    <div>
                      <strong>{post.author.full_name}</strong>
                      <span className="post-type">{post.post_type}</span>
                      <time>{new Date(post.created_at).toLocaleDateString()}</time>
                    </div>
                    <button
                      type="button"
                      className={post.following_author ? 'button button-tertiary' : 'button button-primary'}
                      onClick={() => handleFollow(post)}
                    >
                      {post.following_author ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  {post.image_url && (
                    <div className="post-image" style={{ backgroundImage: `url(${post.image_url})` }} />
                  )}
                  {post.title && <h3>{post.title}</h3>}
                  <p>{post.content}</p>
                  {post.destination_name && (
                    <span className="post-dest">📍 {post.destination_name}</span>
                  )}
                  <div className="post-actions">
                    <button type="button" onClick={() => handleLike(post)}>
                      {post.liked_by_me ? '❤️' : '🤍'} {post.likes_count}
                    </button>
                    <button type="button" onClick={() => toggleComments(post.id)}>
                      💬 {post.comments_count}
                    </button>
                  </div>
                  {expandedPost === post.id && (
                    <div className="post-comments">
                      {(comments[post.id] || []).map((c) => (
                        <div key={c.id} className="comment">
                          <strong>{c.author.full_name}</strong>
                          <p>{c.content}</p>
                        </div>
                      ))}
                      <div className="comment-form">
                        <input
                          placeholder="Write a comment…"
                          value={commentDraft[post.id] || ''}
                          onChange={(e) => setCommentDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                        />
                        <button type="button" onClick={() => submitComment(post.id)}>Send</button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Create Group ── */}
      {activeTab === 'create' && (
        <section className="comm-tab-section">
          <div className="comm-tab-header">
            <div>
              <h2 className="comm-tab-title">Create a Tour Group</h2>
              <p className="comm-tab-sub">Start a new group trip, set your destination and invite others to join.</p>
            </div>
          </div>

          <section className="create-group-form">
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label required">Group name</label>
                <input className="form-control" required value={groupForm.name}
                  onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label required">Destination</label>
                <select className="form-control" value={groupForm.destination_slug}
                  onChange={(e) => setGroupForm((f) => ({ ...f, destination_slug: e.target.value }))} required>
                  <option value="">Select destination</option>
                  {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
                </select>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="form-group">
                  <label className="form-label required">Start date</label>
                  <input className="form-control" type="date" required value={groupForm.start_date}
                    onChange={(e) => setGroupForm((f) => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label required">End date</label>
                  <input className="form-control" type="date" required value={groupForm.end_date}
                    onChange={(e) => setGroupForm((f) => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Description</label>
                <textarea className="form-control" required rows={4} value={groupForm.description}
                  onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label required">Max members</label>
                <input className="form-control" type="number" min={2} required value={groupForm.max_members}
                  onChange={(e) => setGroupForm((f) => ({ ...f, max_members: Number(e.target.value) }))} />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="form-group">
                  <label className="form-label required">Join type</label>
                  <select className="form-control" value={groupForm.join_type}
                    onChange={(e) => setGroupForm((f) => ({ ...f, join_type: e.target.value }))}>
                    <option value="open">Open (direct join)</option>
                    <option value="request">Request approval</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Membership fee</label>
                  <select className="form-control" value={groupForm.fee_type}
                    onChange={(e) => setGroupForm((f) => ({ ...f, fee_type: e.target.value }))}>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {groupForm.fee_type === 'paid' && (
                <div className="form-group">
                  <label className="form-label required">Fee amount (BDT)</label>
                  <input className="form-control" type="number" min={0} value={groupForm.membership_fee} required
                    onChange={(e) => setGroupForm((f) => ({ ...f, membership_fee: Number(e.target.value) }))} />
                </div>
              )}

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="form-group">
                  <label className="form-label required">Contact method</label>
                  <select className="form-control" value={groupForm.contact_method}
                    onChange={(e) => setGroupForm((f) => ({ ...f, contact_method: e.target.value }))}>
                    <option value="app">In app</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Contact detail</label>
                  <input className="form-control" value={groupForm.contact_value} required
                    onChange={(e) => setGroupForm((f) => ({ ...f, contact_value: e.target.value }))} />
                </div>
              </div>

              <h3 style={{marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem'}}>Itinerary preview</h3>
              {groupForm.itinerary.map((item, idx) => (
                <div key={idx} style={{display: 'grid', gridTemplateColumns: '80px 1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem'}}>
                  <input className="form-control" type="number" min={1} placeholder="Day" value={item.day_number}
                    onChange={(e) => {
                      const it = [...groupForm.itinerary]
                      it[idx] = { ...item, day_number: Number(e.target.value) }
                      setGroupForm((f) => ({ ...f, itinerary: it }))
                    }} />
                  <input className="form-control" placeholder="Title" value={item.title}
                    onChange={(e) => {
                      const it = [...groupForm.itinerary]
                      it[idx] = { ...item, title: e.target.value }
                      setGroupForm((f) => ({ ...f, itinerary: it }))
                    }} />
                  <input className="form-control" placeholder="Description" value={item.description}
                    onChange={(e) => {
                      const it = [...groupForm.itinerary]
                      it[idx] = { ...item, description: e.target.value }
                      setGroupForm((f) => ({ ...f, itinerary: it }))
                    }} />
                </div>
              ))}

              <button type="button" className="button button-tertiary"
                onClick={() => setGroupForm((f) => ({
                  ...f,
                  itinerary: [...f.itinerary, { day_number: f.itinerary.length + 1, title: '', description: '' }],
                }))}>
                + Add day
              </button>
              <button type="submit" className="button button-primary create-submit">Create group</button>
            </form>
          </section>
        </section>
      )}

      {/* Shared tab styles */}
      <style>{`
        main.page-shell.community-page {
          margin-top: 98px !important;
          margin-left: 264px !important;
          width: calc(100% - 264px) !important;
          max-width: none !important;
          padding: 0 2rem 2rem 2rem !important;
          min-height: calc(100vh - 98px);
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          main.page-shell.community-page {
            margin-left: 80px !important;
            width: calc(100% - 80px) !important;
          }
        }
        @media (max-width: 768px) {
          main.page-shell.community-page {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 1rem !important;
          }
        }

        .comm-tab-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .comm-tab-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .comm-tab-title {
          font-size: 1.3rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 .3rem;
        }
        .comm-tab-sub {
          font-size: .88rem;
          color: #64748b;
          margin: 0;
        }
        .comm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
          padding: 2.5rem;
          background: #f8fafc;
          border-radius: 14px;
          border: 1.5px dashed #cbd5e1;
          text-align: center;
        }
        .comm-empty span { font-size: 2rem; }
        .comm-empty p { color: #64748b; margin: 0; font-size: .9rem; }
      `}</style>
    </main>
  )
}
