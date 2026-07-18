import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getTechnicianWorkspace } from './technicianWorkOrdersService';

export default function useTechnicianWorkspace(userId) {
  const [data, setData] = useState({ technician: null, workOrders: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      setLoading(true);
      setError('');
      try {
        const workspace = await getTechnicianWorkspace(userId);
        if (active) setData(workspace);
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(
            requestError,
            'No fue posible cargar el espacio de trabajo del técnico.',
          ));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWorkspace();
    return () => { active = false; };
  }, [reloadKey, userId]);

  return { ...data, loading, error, reload };
}
