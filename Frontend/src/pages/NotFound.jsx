import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page-shell page-notfound">
      <div className="panel">
        <span className="eyebrow">404</span>
        <h1>Page not found.</h1>
        <p>We couldn’t locate that destination. Try returning to the home page.</p>
        <Link to="/" className="button button-primary">
          Back to Home
        </Link>
      </div>
    </main>
  )
}
