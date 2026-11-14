import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export const Setup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.setup(formData);
      setUser(response.user);
      setToken(response.token);
      // Reload the app to trigger the setup check again
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
            LibraryDownloadarr
          </h1>
          <p className="text-base md:text-lg text-gray-300 font-medium">Bienvenue ! C’est parti</p>
        </div>

        {/* Info Callout */}
        <div className="card p-4 md:p-6 mb-6 border-2 border-primary-500/20 bg-primary-500/5">
          <div className="flex items-start space-x-3">
            <div className="text-2xl md:text-3xl mt-0.5">🔐</div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-primary-400 mb-2">Configuration initiale : crée le compte admin</h2>
              <p className="text-sm md:text-base text-gray-300 mb-2">
                C’est une <strong>configuration unique</strong> pour créer ton compte administrateur. Tu n’auras à le faire qu’une seule fois.
              </p>
              <ul className="text-xs md:text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Ce compte admin aura un accès complet aux paramètres et aux journaux</li>
                <li>Ensuite, tu configureras la connexion à ton serveur Plex</li>
                <li>Les utilisateurs classiques se connecteront avec leur compte Plex</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-6">Crée ton compte admin</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm md:text-base font-medium mb-2 text-gray-200">Nom d’utilisateur admin</label>
              <input
                type="text"
                required
                className="input text-sm md:text-base"
                placeholder="Choisis un nom d’utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Ce sera ton identifiant administrateur</p>
            </div>

            <div>
              <label className="block text-sm md:text-base font-medium mb-2 text-gray-200">Mot de passe admin</label>
              <input
                type="password"
                required
                minLength={6}
                className="input text-sm md:text-base"
                placeholder="Choisis un mot de passe sûr"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">6 caractères minimum</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs md:text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full text-sm md:text-base py-3 font-semibold">
              {isLoading ? 'Création du compte…' : 'Créer le compte admin et continuer'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-50">
            <p className="text-xs md:text-sm text-gray-400 text-center">
              <strong>Étape suivante :</strong> une fois ton compte admin créé, tu configureras la connexion à ton serveur Plex dans la page Paramètres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
