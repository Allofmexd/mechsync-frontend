import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getCustomerById } from '../customers/customersService';
import { getVehicleIntakeById } from '../vehicleIntakes/vehicleIntakesService';
import { getVehicleById } from '../vehicles/vehiclesService';

function unwrap(response) {
  return response?.data ?? response;
}

export default function useWorkOrderRelations(workOrders) {
  const relationKey = useMemo(
    () => workOrders.map((workOrder) => `${workOrder.id}:${workOrder.vehicleIntakeId}`).join('|'),
    [workOrders],
  );
  const [relations, setRelations] = useState({ intakes: {}, vehicles: {}, customers: {} });
  const [loading, setLoading] = useState(Boolean(workOrders.length));
  const [warning, setWarning] = useState('');

  useEffect(() => {
    let active = true;
    async function loadRelations() {
      if (!workOrders.length) {
        setRelations({ intakes: {}, vehicles: {}, customers: {} });
        setLoading(false);
        setWarning('');
        return;
      }

      setLoading(true);
      setWarning('');
      const next = { intakes: {}, vehicles: {}, customers: {} };
      const failures = [];

      const intakeIds = [...new Set(workOrders.map((order) => order.vehicleIntakeId).filter(Boolean))];
      const intakeResults = await Promise.allSettled(intakeIds.map((id) => getVehicleIntakeById(id)));
      intakeResults.forEach((result, index) => {
        if (result.status === 'fulfilled') next.intakes[intakeIds[index]] = unwrap(result.value);
        else failures.push(result.reason);
      });

      const vehicleIds = [...new Set(Object.values(next.intakes).map((intake) => intake.vehicleId).filter(Boolean))];
      const vehicleResults = await Promise.allSettled(vehicleIds.map((id) => getVehicleById(id)));
      vehicleResults.forEach((result, index) => {
        if (result.status === 'fulfilled') next.vehicles[vehicleIds[index]] = unwrap(result.value);
        else failures.push(result.reason);
      });

      const customerIds = [...new Set(Object.values(next.vehicles).map((vehicle) => vehicle.customerId).filter(Boolean))];
      const customerResults = await Promise.allSettled(customerIds.map((id) => getCustomerById(id)));
      customerResults.forEach((result, index) => {
        if (result.status === 'fulfilled') next.customers[customerIds[index]] = unwrap(result.value);
        else failures.push(result.reason);
      });

      if (active) {
        setRelations(next);
        if (failures.length) {
          setWarning(getApiErrorMessage(
            failures[0],
            'Algunos datos relacionados no pudieron cargarse y se muestran como no disponibles.',
          ));
        }
        setLoading(false);
      }
    }

    loadRelations();
    return () => { active = false; };
  }, [relationKey]);

  return { ...relations, loading, warning };
}
