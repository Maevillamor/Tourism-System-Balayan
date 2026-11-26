import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { CLIENT_URL } from '../config.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect username or password. Please try again.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="public-page">
      <header className="public-header">
        <a className="public-brand" href={CLIENT_URL}>
          <Logo size={40} />
          <div>
            <strong>Visit Balayan</strong>
            <span>Tourism Office of Balayan</span>
          </div>
        </a>
        <nav>
          <a href={CLIENT_URL}>Book appointment</a>
          <a href={CLIENT_URL}>Track appointment</a>
          <span className="current">Admin login</span>
        </nav>
      </header>

      <main className="login-wrap">
        <section className="login-card">
          <div className="login-side">
            <p className="eyebrow light">Admin portal</p>
            <h2>Manage appointments for the Tourism Office</h2>
            <ul>
              <li>Review and confirm requests</li>
              <li>Monitor the daily and weekly schedule</li>
              <li>Set services and available slots</li>
            </ul>
          </div>

          <form className="login-form" onSubmit={submit} noValidate>
            <h1>Sign in</h1>
            <p className="muted">Use your office account. Access depends on your role.</p>

            {error && <p className="alert" role="alert">{error}</p>}

            <label className="field">Username
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                autoComplete="username" autoFocus />
            </label>
            <label className="field" htmlFor="password">Password
              <span className="pw-wrap">
                <input id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}
                  aria-pressed={showPw} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            <button className="btn primary block" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="small muted">
              Trying to book a visit? <a href={CLIENT_URL}>Go to the booking page</a>.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
