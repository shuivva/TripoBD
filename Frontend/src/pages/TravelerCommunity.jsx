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
    try {
      await createCommunityPost({ ...postForm, user_id: userId })
      setPostForm({ post_type: 'tip', title: '', content: '', image_url: '' })
      loadFeed()
    } catch (e) {
      setMessage(e.message)
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
    <main className="page-shell community-page">
      <header className="community-header">
        <h1>Tour Groups &amp; Community</h1>
        <p>Find travel buddies, join open groups, and share your journey.</p>
      </header>

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

      {message && <p className="community-message">{message}</p>}
      {error && <p className="community-error">{error}</p>}

      {activeTab === 'browse' && (
        <section>
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
        </section>
      )}

      {activeTab === 'my' && (
        <section>
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
        </section>
      )}

      {activeTab === 'feed' && (
        <section className="feed-layout">
          <div className="feed-sidebar">
            <h3>Share with community</h3>
            <form className="post-form" onSubmit={handleCreatePost}>
              <select
                value={postForm.post_type}
                onChange={(e) => setPostForm((p) => ({ ...p, post_type: e.target.value }))}
              >
                <option value="story">Trip Story</option>
                <option value="photo">Photo</option>
                <option value="tip">Travel Tip</option>
              </select>
              <input
                placeholder="Title"
                value={postForm.title}
                onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                placeholder="What would you like to share?"
                value={postForm.content}
                onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))}
                required
              />
              <input
                placeholder="Image URL (optional)"
                value={postForm.image_url}
                onChange={(e) => setPostForm((p) => ({ ...p, image_url: e.target.value }))}
              />
              <button type="submit" className="button button-primary">Post</button>
            </form>
            <div className="feed-filters">
              <button
                type="button"
                className={!feedFilter ? 'chip active' : 'chip'}
                onClick={() => setFeedFilter('')}
              >
                All
              </button>
              {['story', 'photo', 'tip'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={feedFilter === t ? 'chip active' : 'chip'}
                  onClick={() => setFeedFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
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
        <section className="create-group-form">
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
