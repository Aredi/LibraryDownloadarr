import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { formatBytes } from '../utils/format';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export const DownloadHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admin users
    if (user && !user.isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await api.getAllDownloadHistory(200);
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de charger l’historique des téléchargements');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  return (
    <Layout>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Historique des téléchargements</h1>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 md:mb-6 text-sm md:text-base">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center text-gray-400 py-12">Chargement…</div>
            ) : history.length === 0 ? (
              <div className="card p-6 md:p-8 text-center">
                <p className="text-sm md:text-base text-gray-400">Aucun téléchargement pour l’instant</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-200">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Titre
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Taille
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Téléchargé le
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-50">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-dark-200/50">
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                            {item.username || 'Utilisateur inconnu'}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm">{item.media_title}</td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-400">
                            {formatBytes(item.file_size)}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-400">
                            {formatDate(item.downloaded_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Layout>
  );
};
