export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>ProtomForms Backend API</h1>
      <p>This is the backend API server for ProtomForms.</p>
      <p>Available endpoints:</p>
      <ul>
        <li><a href="/api/health/database">/api/health/database</a> - Database health check</li>
        <li><a href="/api/forms">/api/forms</a> - Forms management</li>
        <li><a href="/api/users">/api/users</a> - User management</li>
        <li><a href="/api/auth/signin">/api/auth/signin</a> - Authentication</li>
      </ul>
      <p>Frontend should be running on <a href="http://localhost:3000">http://localhost:3000</a></p>
    </div>
  )
}


