import { useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import './AccountPage.css';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, updateAccountEmail, deleteAccount } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email ?? '');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasEmailChanged = useMemo(() => email.trim() !== (user?.email ?? ''), [email, user?.email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email nie może być pusty.');
      return;
    }

    setSaving(true);
    try {
      await updateAccountEmail(email.trim());
      setMessage('Email został zaktualizowany.');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Ten email jest już zajęty.');
      } else {
        setError(getApiErrorMessage(err, 'Nie udało się zaktualizować emaila.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć konto? Tej operacji nie da się cofnąć.');
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      navigate('/login', { replace: true });
    } catch {
      setError('Nie udało się usunąć konta.');
      setDeleting(false);
    }
  };

  return (
    <main className="account-shell">
      <header className="account-header">
        <div>
          <p className="eyebrow">Ustawienia konta</p>
          <h1>Zarządzaj kontem</h1>
        </div>
        <Link to="/" className="back-link">Wróć do planera</Link>
      </header>

      <section className="account-layout">
        <form className="account-card" onSubmit={handleSubmit}>
          <div className="account-card-header">
            <h2>Informacje podstawowe</h2>
            <span>{user?.role ?? 'USER'}</span>
          </div>

          {message && <div className="account-alert success">{message}</div>}
          {error && <div className="account-alert error">{error}</div>}

          <label>
            Nazwa użytkownika
            <input type="text" value={user?.username ?? ''} readOnly />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="twoj@email.pl"
              required
            />
          </label>

          <label>
            Awaryjny email
            <input
              type="email"
              value={emergencyEmail}
              onChange={(event) => setEmergencyEmail(event.target.value)}
              placeholder="np. zapasowy@email.pl"
            />
          </label>

          <p className="account-note">
            Awaryjny email jest na razie polem przygotowanym pod przyszłą obsługę odzyskiwania konta.
          </p>

          <div className="account-actions">
            <button type="submit" disabled={!hasEmailChanged || saving} className="primary-button">
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>

        <section className="danger-zone">
          <div>
            <h2>Usunięcie konta</h2>
            <p>Usunięcie konta usuwa również Twoje projekty i zadania.</p>
          </div>
          <button type="button" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? 'Usuwanie...' : 'Usuń konto'}
          </button>
        </section>
      </section>
    </main>
  );
};

export default AccountPage;
