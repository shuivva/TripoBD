import { Link } from 'react-router-dom'

export default function GroupCard({ group, onJoin, joining }) {
  const feeLabel = group.fee_type === 'paid'
    ? `৳${Number(group.membership_fee).toLocaleString()}`
    : 'Free'

  return (
    <article className="group-card">
      <div
        className="group-card-image"
        style={{ backgroundImage: `url(${group.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'})` }}
      />
      <div className="group-card-body">
        <div className="group-card-meta">
          <span className="group-fee">{feeLabel}</span>
          {group.join_type === 'request' && <span className="group-badge">Approval</span>}
        </div>
        <h3>{group.name}</h3>
        <p className="group-dest">{group.destination_name || 'Various destinations'}</p>
        <p className="group-organiser">Organiser: {group.organizer_name}</p>
        <p className="group-dates">{group.start_date} → {group.end_date}</p>
        <div className="group-card-footer">
          <span className="group-members">
            {group.member_count} / {group.max_members} members
          </span>
          <div className="group-card-actions">
            <Link to={`/traveler/community/groups/${group.id}`} className="button button-tertiary">
              Details
            </Link>
            {group.user_membership_status === 'joined' ? (
              <span className="joined-label">Joined</span>
            ) : group.user_membership_status === 'pending' ? (
              <span className="pending-label">Pending</span>
            ) : group.is_full ? (
              <span className="full-label">Full</span>
            ) : (
              <button
                type="button"
                className="button button-primary"
                disabled={joining}
                onClick={() => onJoin?.(group.id)}
              >
                {joining ? '…' : group.join_type === 'request' ? 'Request' : 'Join'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
