import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getOpenTourGroupDetail, joinOpenTourGroup, inviteToTourGroup } from '../apiClient'
import './community.css'

export default function GroupDetail() {
  const { groupId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = useMemo(() => localStorage.getItem('userId'), [])
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [joining, setJoining] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)

  const fromInvite = searchParams.get('invite') === '1'

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    getOpenTourGroupDetail(groupId, userId)
      .then(setGroup)
      .catch(() => setMessage('Could not load group details.'))
      .finally(() => setLoading(false))
  }, [groupId, userId])

  const handleJoin = async (acceptInvite = false) => {
    setJoining(true)
    setMessage('')
    try {
      const res = await joinOpenTourGroup(groupId, userId, {
        acceptInvite: acceptInvite || group?.pending_invite || fromInvite,
      })
      setMessage(res.message)
      const updated = await getOpenTourGroupDetail(groupId, userId)
      setGroup(updated)
      if (fromInvite) {
        setSearchParams({}, { replace: true })
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setJoining(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!inviteUsername.trim()) {
      setMessage('Enter a username to invite.')
      return
    }
    setInviting(true)
    try {
      const res = await inviteToTourGroup(groupId, userId, inviteUsername)
      setMessage(res.message)
      setInviteUsername('')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setInviting(false)
    }
  }

  if (!userId) {
    return (
      <main className="page-shell community-page">
        <p className="community-error">Please sign in to view this group.</p>
        <Link to="/signin" className="button button-primary">Sign In</Link>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="page-shell community-page">
        <p className="community-muted">Loading group…</p>
      </main>
    )
  }

  if (!group) {
    return (
      <main className="page-shell community-page">
        <p className="community-error">{message || 'Group not found.'}</p>
        <Link to="/traveler/community" className="button button-tertiary">Back to community</Link>
      </main>
    )
  }

  const feeLabel = group.fee_type === 'paid'
    ? `৳${Number(group.membership_fee).toLocaleString()}`
    : 'Free'

  return (
    <main className="page-shell community-page group-detail-page">
      <Link to="/traveler/community" className="back-link">← Back to groups</Link>

      <div
        className="group-detail-hero"
        style={{ backgroundImage: `url(${group.cover_image || ''})` }}
      >
        <div className="group-detail-hero-overlay">
          <h1>{group.name}</h1>
          <p>{group.destination_name} · {group.start_date} – {group.end_date}</p>
        </div>
      </div>

      {message && <p className="community-message">{message}</p>}

      <div className="group-detail-grid">
        <section className="detail-panel">
          <h2>About this group</h2>
          <p>{group.description}</p>
          <ul className="detail-facts">
            <li><strong>Organiser:</strong> {group.organizer?.full_name}</li>
            <li><strong>Members:</strong> {group.member_count} / {group.max_members}</li>
            <li><strong>Fee:</strong> {feeLabel}</li>
            <li><strong>Join:</strong> {group.join_type === 'open' ? 'Open' : 'By request'}</li>
            <li><strong>Contact:</strong> {group.contact_method} {group.contact_value && `· ${group.contact_value}`}</li>
          </ul>

          {group.pending_invite && group.user_membership_status !== 'joined' && (
            <div className="invite-banner">
              <p>You have been invited to this group!</p>
              <button
                type="button"
                className="button button-primary"
                disabled={joining || group.is_full}
                onClick={() => handleJoin(true)}
              >
                {joining ? 'Joining…' : 'Accept invite & join'}
              </button>
            </div>
          )}

          {group.user_membership_status === 'joined' ? (
            <span className="joined-label">You are a member</span>
          ) : group.user_membership_status === 'pending' ? (
            <span className="pending-label">Request pending</span>
          ) : group.is_full ? (
            <span className="full-label">Group is full</span>
          ) : !group.pending_invite ? (
            <button
              type="button"
              className="button button-primary"
              disabled={joining}
              onClick={() => handleJoin(false)}
            >
              {joining ? 'Processing…' : group.join_type === 'request' ? 'Request to join' : 'Join group'}
            </button>
          ) : null}
        </section>

        {group.can_invite && (
          <section className="detail-panel invite-panel">
            <h2>Invite someone</h2>
            <p className="community-muted">Invite a traveler by their TripoBD username.</p>
            <form className="invite-form" onSubmit={handleInvite}>
              <input
                type="text"
                placeholder="Username (e.g. shuvo)"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="button button-primary" disabled={inviting}>
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </form>
          </section>
        )}

        <section className="detail-panel">
          <h2>Itinerary preview</h2>
          {group.itinerary?.length === 0 ? (
            <p className="community-muted">No itinerary added yet.</p>
          ) : (
            <ol className="itinerary-list">
              {group.itinerary.map((item) => (
                <li key={item.id}>
                  <strong>Day {item.day_number}: {item.title}</strong>
                  <p>{item.description}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="detail-panel">
          <h2>Organiser</h2>
          <div className="organiser-card">
            <div className="organiser-avatar">
              {group.organizer?.avatar_url ? (
                <img src={group.organizer.avatar_url} alt="" />
              ) : (
                <span>{group.organizer?.avatar_initials}</span>
              )}
            </div>
            <div>
              <strong>{group.organizer?.full_name}</strong>
              <button
                type="button"
                className="button button-tertiary"
                onClick={() => navigate('/traveler/profile')}
              >
                View profile
              </button>
            </div>
          </div>
        </section>

        <section className="detail-panel">
          <h2>Members ({group.members?.length || 0})</h2>
          <div className="members-list">
            {group.members?.map((m) => (
              <div key={m.id} className="member-chip">
                <span className="member-avatar">
                  {m.profile.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="" />
                  ) : (
                    m.profile.avatar_initials
                  )}
                </span>
                <span>{m.profile.full_name}</span>
                {m.role === 'organizer' && <span className="role-badge">Organiser</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
