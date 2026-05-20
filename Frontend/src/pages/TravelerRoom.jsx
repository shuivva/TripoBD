import { Link } from 'react-router-dom'

export default function TravelerRoom() {
  return (
    <main className="page-shell">
      <h1>Tour Rooms</h1>
      <p>
        Active chat rooms for trips you have joined are available from your dashboard.
        To browse and join new open tour groups, visit the community page.
      </p>
      <Link to="/traveler/community?tab=browse" className="button button-primary">
        Browse tour groups
      </Link>
    </main>
  )
}
