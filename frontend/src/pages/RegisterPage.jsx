import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    try {
      await register(email, username, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error("Rejestracja error:", err);
      if (err.response && err.response.status === 409) {
        const message = getApiErrorMessage(err);
        setError(message === "Email already exists"
          ? "Użytkownik z podanym adresem e-mail już istnieje."
          : "Użytkownik o takiej nazwie już istnieje.");
      } else {
        setError(getApiErrorMessage(err, "Wystąpił błąd podczas rejestracji."));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Zarejestruj się</h2>
          <p className="mt-2 text-sm text-gray-600">
            dołącz do AI Powered Planner
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-green-700">Konto założone pomyślnie! Przekierowanie do logowania...</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adres e-mail</label>
            <div className="mt-1">
              <input
                type="email"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="jan.kowalski@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nazwa użytkownika</label>
            <div className="mt-1">
              <input
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="JanKowalski"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hasło</label>
            <div className="mt-1">
              <input
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Powtórz hasło</label>
            <div className="mt-1">
              <input
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
            >
              Utwórz konto
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500 transition duration-150">
              Zaloguj się tutaj.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
