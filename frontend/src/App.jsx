import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setHealth(res.data))
      .catch(err => setError(err.message))
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Music Calendar Frontend</h1>
      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Backend Status:</h2>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {health ? (
          <pre>{JSON.stringify(health, null, 2)}</pre>
        ) : (
          !error && <p>Loading...</p>
        )}
      </div>
    </div>
  )
}

export default App
