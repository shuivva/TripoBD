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
  { id: 'browse', label: 'Browse Groups' },
  { id: 'my', label: 'My Groups' },
  { id: 'feed', label: 'Community Feed' },
  { id: 'create', label: 'Create Group' },
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

  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState({ organized: [], joined: [] })
  const [feed, setFeed] = useState([])
  const [destinations, setDestinations] = useState([])
  const [filters, setFilters] = useState({
    destination: '',
    date_from: '',
    date_to: '',
    min_size: '',
    max_size: '',
    fee_type: '',
    search: '',
  })
  const [feedFilter, setFeedFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [joiningId, setJoiningId] = useState(null)
  const [groupForm, setGroupForm] = useState(emptyGroupForm)
  const [postForm, setPostForm] = useState({ post_type: 'tip', title: '', content: '', image_url: '' })
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments] = useState({})
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
    if (!userId) {
      setError('Please sign in to use the community.')
      return
    }
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
    if (!postForm.content.trim()) {
      setMessage('Please write something before posting.')
      return
    }
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
        prev.map((p) =>
          p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p
        )
      )
    } catch {
      /* ignore */
    }
  }

  const handleFollow = async (post) => {
    try {
      const follow = !post.following_author
      await toggleFollowTraveler(userId, post.author.id, follow)
      setFeed((prev) =>
        prev.map((p) =>
          p.author.id === post.author.id ? { ...p, following_author: follow } : p
        )
      )
    } catch {
      /* ignore */
    }
  }

  const toggleComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      return
    }
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
    <main className="page-shell community-page-shell">
      {error && <div className="profile-alert error">{error}</div>}
      {message && <div className="profile-alert success">{message}</div>}

      <header className="community-page-header">
        <h1>Tour Groups &amp; Community</h1>
        <p>Find travel buddies, join open groups, and share your journey.</p>
      </header>

      <nav className="community-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-nav-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'browse' && (
        <section className="feed-layout">
          <div className="feed-main">
          <form
            className="community-filters"
            onSubmit={(e) => {
              e.preventDefault()
              loadGroups()
            }}
          >
            <input
              placeholder="Search groups…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <select
              value={filters.destination}
              onChange={(e) => setFilters((f) => ({ ...f, destination: e.target.value }))}
            >
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            />
            <input
              type="number"
              placeholder="Min size"
              value={filters.min_size}
              onChange={(e) => setFilters((f) => ({ ...f, min_size: e.target.value }))}
            />
            <input
              type="number"
              placeholder="Max size"
              value={filters.max_size}
              onChange={(e) => setFilters((f) => ({ ...f, max_size: e.target.value }))}
            />
            <select
              value={filters.fee_type}
              onChange={(e) => setFilters((f) => ({ ...f, fee_type: e.target.value }))}
            >
              <option value="">Any fee</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            <button type="submit" className="button button-primary">Filter</button>
          </form>

          {loading ? (
            <p className="community-muted">Loading groups…</p>
          ) : groups.length === 0 ? (
            <p className="community-muted">No open groups match your filters.</p>
          ) : (
            <div className="groups-grid">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  joining={joiningId === g.id}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
          </div>
        </section>
      )}

      {activeTab === 'my' && (
        <section className="feed-layout">
          <div className="feed-main">
          {loading ? (
            <p className="community-muted">Loading…</p>
          ) : (
            <>
              <h2 className="section-title">Groups I organised</h2>
              {myGroups.organized?.length === 0 ? (
                <p className="community-muted">You have not created any groups yet.</p>
              ) : (
                <div className="groups-grid">
                  {myGroups.organized.map((g) => (
                    <GroupCard key={g.id} group={g} />
                  ))}
                </div>
              )}
              <h2 className="section-title">Groups I joined</h2>
              {myGroups.joined?.length === 0 ? (
                <p className="community-muted">You have not joined any groups yet.</p>
              ) : (
                <div className="groups-grid">
                  {myGroups.joined.map((g) => (
                    <GroupCard key={g.id} group={{ ...g, user_membership_status: 'joined' }} />
                  ))}
                </div>
              )}
            </>
          )}
          </div>
        </section>
      )}

      {activeTab === 'feed' && (
        <section className="feed-layout">
          <div className="feed-sidebar">
            {/* ── Composer Card ── */}
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
                ].map(t => (
                  <button
                    key={t.value} type="button"
                    className={`composer-type-btn${postForm.post_type === t.value ? ' composer-type-active' : ''}`}
                    onClick={() => setPostForm(p => ({ ...p, post_type: t.value }))}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <form className="composer-form" onSubmit={handleCreatePost}>
                <div className="composer-field">
                  <label>✏️ Title</label>
                  <input
                    className="composer-input"
                    placeholder={
                      postForm.post_type === 'story' ? 'e.g. Sunrise at Cox\'s Bazar…' :
                      postForm.post_type === 'photo' ? 'Caption for your photo…' :
                      'e.g. Best time to visit Sajek…'
                    }
                    value={postForm.title}
                    onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="composer-field">
                  <label>
                    {postForm.post_type === 'story' ? '📝 Your Story' :
                     postForm.post_type === 'photo' ? '📝 Description' : '💡 Your Tip'}
                  </label>
                  <textarea
                    className="composer-textarea"
                    rows={4}
                    placeholder={
                      postForm.post_type === 'story' ? 'Tell us about your journey…' :
                      postForm.post_type === 'photo' ? 'What\'s happening in this photo?' :
                      'Share a helpful tip for other travelers…'
                    }
                    value={postForm.content}
                    onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))}
                    required
                  />
                </div>

                {postForm.post_type === 'photo' && (
                  <div className="composer-field">
                    <label>🔗 Image URL</label>
                    <input
                      className="composer-input"
                      placeholder="https://..."
                      value={postForm.image_url}
                      onChange={(e) => setPostForm((p) => ({ ...p, image_url: e.target.value }))}
                    />
                  </div>
                )}

                {postForm.image_url && postForm.post_type !== 'photo' && (
                  <div className="composer-field">
                    <label>🔗 Image URL (optional)</label>
                    <input
                      className="composer-input"
                      placeholder="https://..."
                      value={postForm.image_url}
                      onChange={(e) => setPostForm((p) => ({ ...p, image_url: e.target.value }))}
                    />
                  </div>
                )}

                <button type="submit" className="composer-submit">
                  🚀 Share Post
                </button>
              </form>
            </div>

            {/* ── Feed Filters ── */}
            <div className="composer-filters">
              <p className="composer-filter-label">Filter by type</p>
              <div className="composer-filter-row">
                {[
                  { val: '', icon: '🌐', label: 'All' },
                  { val: 'story', icon: '📖', label: 'Stories' },
                  { val: 'photo', icon: '📸', label: 'Photos' },
                  { val: 'tip',   icon: '💡', label: 'Tips' },
                ].map(f => (
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

            <style>{`
              main.community-page-shell {
                margin-top: 60px !important;
                margin-left: 240px !important;
                width: calc(100% - 240px) !important;
                max-width: none !important;
                padding: 2rem !important;
                min-height: calc(100vh - 60px);
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 2rem;
              }

              @media (max-width: 1024px) {
                main.community-page-shell {
                  margin-left: 70px !important;
                  width: calc(100% - 70px) !important;
                }
              }
              .community-page-header h1 {
                margin: 0 0 0.35rem 0;
                font-size: 2.2rem;
                font-weight: 850;
                color: #0f172a;
              }
              .community-page-header p {
                margin: 0;
                font-size: 1.05rem;
                color: #64748b;
                max-width: 800px;
              }

              .community-tabs-bar {
                display: flex;
                gap: 0.5rem;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 0.5rem;
              }
              .tab-nav-btn {
                background: transparent;
                border: none;
                padding: 0.75rem 1.25rem;
                font-size: 0.95rem;
                font-weight: 750;
                color: #64748b;
                cursor: pointer;
                border-radius: 10px;
                transition: all 0.2s;
              }
              .tab-nav-btn:hover {
                background: #f8fafc;
                color: #0f172a;
              }
              .tab-nav-btn.active {
                background: linear-gradient(135deg, #5b8cff, #6ee7b7);
                color: #0f1724;
                font-weight: 800;
              }

            `}</style>
          </div>

          <div className="feed-main">
            {loading ? (
              <p className="community-muted">Loading feed…</p>
            ) : feed.length === 0 ? (
              <p className="community-muted">No posts yet. Be the first to share!</p>
            ) : (
              feed.map((post) => (
                <article key={post.id} className="feed-post">
                  <div className="post-header">
                    <div className="post-author-avatar">
                      {post.author.avatar_url ? (
                        <img src={post.author.avatar_url} alt="" />
                      ) : (
                        <span>{post.author.avatar_initials}</span>
                      )}
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
                    <div
                      className="post-image"
                      style={{ backgroundImage: `url(${post.image_url})` }}
                    />
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
                          onChange={(e) =>
                            setCommentDraft((d) => ({ ...d, [post.id]: e.target.value }))
                          }
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

      {activeTab === 'create' && (
        <section className="feed-layout">
          <div className="feed-main">
          <div className="create-group-form">
          <h2>Create an open tour group</h2>
          <form onSubmit={handleCreateGroup}>
            <label>Group name</label>
            <input
              required
              value={groupForm.name}
              onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
            />
            <label>Destination</label>
            <select
              value={groupForm.destination_slug}
              onChange={(e) => setGroupForm((f) => ({ ...f, destination_slug: e.target.value }))}
            >
              <option value="">Select destination</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
            <div className="form-row">
              <div>
                <label>Start date</label>
                <input
                  type="date"
                  required
                  value={groupForm.start_date}
                  onChange={(e) => setGroupForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label>End date</label>
                <input
                  type="date"
                  required
                  value={groupForm.end_date}
                  onChange={(e) => setGroupForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <label>Description</label>
            <textarea
              required
              rows={4}
              value={groupForm.description}
              onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
            />
            <label>Max members</label>
            <input
              type="number"
              min={2}
              required
              value={groupForm.max_members}
              onChange={(e) => setGroupForm((f) => ({ ...f, max_members: Number(e.target.value) }))}
            />
            <div className="form-row">
              <div>
                <label>Join type</label>
                <select
                  value={groupForm.join_type}
                  onChange={(e) => setGroupForm((f) => ({ ...f, join_type: e.target.value }))}
                >
                  <option value="open">Open (direct join)</option>
                  <option value="request">Request approval</option>
                </select>
              </div>
              <div>
                <label>Membership fee</label>
                <select
                  value={groupForm.fee_type}
                  onChange={(e) => setGroupForm((f) => ({ ...f, fee_type: e.target.value }))}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            {groupForm.fee_type === 'paid' && (
              <>
                <label>Fee amount (BDT)</label>
                <input
                  type="number"
                  min={0}
                  value={groupForm.membership_fee}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, membership_fee: Number(e.target.value) }))
                  }
                />
              </>
            )}
            <div className="form-row">
              <div>
                <label>Contact method</label>
                <select
                  value={groupForm.contact_method}
                  onChange={(e) => setGroupForm((f) => ({ ...f, contact_method: e.target.value }))}
                >
                  <option value="app">In app</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label>Contact detail</label>
                <input
                  value={groupForm.contact_value}
                  onChange={(e) => setGroupForm((f) => ({ ...f, contact_value: e.target.value }))}
                />
              </div>
            </div>
            <h3>Itinerary preview</h3>
            {groupForm.itinerary.map((item, idx) => (
              <div key={idx} className="itinerary-row">
                <input
                  type="number"
                  min={1}
                  placeholder="Day"
                  value={item.day_number}
                  onChange={(e) => {
                    const itinerary = [...groupForm.itinerary]
                    itinerary[idx] = { ...item, day_number: Number(e.target.value) }
                    setGroupForm((f) => ({ ...f, itinerary }))
                  }}
                />
                <input
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) => {
                    const itinerary = [...groupForm.itinerary]
                    itinerary[idx] = { ...item, title: e.target.value }
                    setGroupForm((f) => ({ ...f, itinerary }))
                  }}
                />
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const itinerary = [...groupForm.itinerary]
                    itinerary[idx] = { ...item, description: e.target.value }
                    setGroupForm((f) => ({ ...f, itinerary }))
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="button button-tertiary"
              onClick={() =>
                setGroupForm((f) => ({
                  ...f,
                  itinerary: [
                    ...f.itinerary,
                    { day_number: f.itinerary.length + 1, title: '', description: '' },
                  ],
                }))
              }
            >
              + Add day
            </button>
            <button type="submit" className="button button-primary create-submit">
              Create group
            </button>
          </form>
        </section>
      )}
    </main>
  )
}
