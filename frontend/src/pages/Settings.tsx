import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Settings as SettingsType } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>({
    plexUrl: '',
    hasPlexToken: false,
  });
  const [plexUrl, setPlexUrl] = useState('');
  const [plexToken, setPlexToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setPlexUrl(data.plexUrl);
    } catch (err) {
      setMessage({ type: 'error', text: 'Impossible de charger les paramètres' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updateData: any = {};
      if (plexUrl) {
        updateData.plexUrl = plexUrl;
      }
      if (plexToken) {
        updateData.plexToken = plexToken;
      }

      await api.updateSettings(updateData);

      setMessage({ type: 'success', text: 'Paramètres enregistrés' });
      await loadSettings();
      setPlexToken('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Impossible d’enregistrer les paramètres' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      // Use values from input boxes if provided, otherwise use saved settings
      const urlToTest = plexUrl || settings.plexUrl;
      const tokenToTest = plexToken || (settings.hasPlexToken ? 'saved' : '');

      if (!urlToTest) {
        setMessage({ type: 'error', text: 'Saisis l’URL du serveur Plex' });
        setIsTesting(false);
        return;
      }

      if (!tokenToTest && !settings.hasPlexToken) {
        setMessage({ type: 'error', text: 'Saisis un Token Plex' });
        setIsTesting(false);
        return;
      }

      const connected = await api.testPlexConnection(
        plexUrl || undefined,
        plexToken || undefined
      );
      if (connected) {
        setMessage({ type: 'success', text: 'Connexion au serveur Plex réussie' });
      } else {
        setMessage({ type: 'error', text: 'Impossible de se connecter au serveur Plex' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Impossible de tester la connexion' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Tous les champs sont obligatoires' });
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
      setIsChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      setIsChangingPassword(false);
      return;
    }

    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié' });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.error || 'Impossible de modifier le mot de passe'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Chargement…</div>
          </div>
      </Layout>
    );
  }

  return (
    <Layout>
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Paramètres</h1>

            <div className="card p-4 md:p-6">
              <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-4">Configuration du serveur Plex</h2>

                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-sm md:text-base font-medium mb-2">URL du serveur Plex</label>
                      <input
                        type="text"
                        className="input text-sm md:text-base"
                        placeholder="http://127.0.0.1:32400"
                        value={plexUrl}
                        onChange={(e) => setPlexUrl(e.target.value)}
                      />
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        L’URL de ton Plex Media Server. Pour des conteneurs Docker locaux, utilise :
                        <br />
                        • <code className="text-gray-400">http://127.0.0.1:32400</code> ou <code className="text-gray-400">http://localhost:32400</code>
                        <br />
                        • <code className="text-gray-400">http://host.docker.internal:32400</code> (depuis un conteneur Docker)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm md:text-base font-medium mb-2">Plex Token</label>
                      <input
                        type="password"
                        className="input text-sm md:text-base"
                        placeholder={
                          settings.hasPlexToken ? 'Token configuré (saisis-en un nouveau pour le changer)' : 'Saisis le Token'
                        }
                        value={plexToken}
                        onChange={(e) => setPlexToken(e.target.value)}
                      />
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Ton Token d’authentification Plex (Token admin pour accéder au serveur)
                      </p>
                    </div>

                    {settings.plexServerName && (
                      <div>
                        <label className="block text-sm md:text-base font-medium mb-2">Serveur configuré</label>
                        <input
                          type="text"
                          className="input text-sm md:text-base bg-dark-200"
                          value={settings.plexServerName}
                          readOnly
                        />
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                          L’identité du serveur est détectée automatiquement quand tu enregistres tes paramètres.
                          Les utilisateurs qui se connectent via Plex OAuth n’auront accès que s’ils ont les droits sur ce serveur.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {message && (
                  <div
                    className={`px-4 py-3 rounded-lg text-xs md:text-sm ${
                      message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button type="submit" disabled={isSaving} className="btn-primary text-sm md:text-base">
                    {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !(plexUrl || settings.plexUrl)}
                    className="btn-secondary text-sm md:text-base"
                  >
                    {isTesting ? 'Test en cours…' : 'Tester la connexion'}
                  </button>
                </div>
              </form>
            </div>

            <div className="card p-4 md:p-6 mt-4 md:mt-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Changer le mot de passe</h2>
              <form onSubmit={handleChangePassword} className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm md:text-base font-medium mb-2">Mot de passe actuel</label>
                  <input
                    type="password"
                    className="input text-sm md:text-base"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Saisis ton mot de passe actuel"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium mb-2">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="input text-sm md:text-base"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Saisis le nouveau mot de passe (6 caractères min.)"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium mb-2">Confirme le nouveau mot de passe</label>
                  <input
                    type="password"
                    className="input text-sm md:text-base"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Saisis-le à nouveau"
                  />
                </div>

                {passwordMessage && (
                  <div
                    className={`px-4 py-3 rounded-lg text-xs md:text-sm ${
                      passwordMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary text-sm md:text-base"
                >
                  {isChangingPassword ? 'Modification…' : 'Changer le mot de passe'}
                </button>
              </form>
            </div>

            <div className="card p-4 md:p-6 mt-4 md:mt-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">À propos</h2>
              <div className="space-y-2 text-xs md:text-sm text-gray-400">
                <p>
                  <span className="font-medium text-gray-300">LibraryDownloadarr</span> v1.0.0
                </p>
                <p>Une application web moderne pour télécharger les médias de ton serveur multimédia</p>
              </div>
            </div>
          </div>
        </Layout>
  );
};
