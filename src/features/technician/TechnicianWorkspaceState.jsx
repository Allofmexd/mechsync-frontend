export default function TechnicianWorkspaceState({ loading, error, technician, reload }) {
  if (loading) {
    return <div className="technician-state"><span className="technician-loader" /><p>Cargando espacio de trabajo...</p></div>;
  }

  if (error) {
    return <div className="technician-state technician-state--error"><strong>Error al cargar</strong><p>{error}</p><button className="admin-button admin-button--primary" type="button" onClick={reload}>Reintentar</button></div>;
  }

  if (!technician) {
    return <div className="technician-state technician-state--warning"><strong>Técnico no asociado</strong><p>Tu usuario no tiene registro de técnico asociado.</p><small>Se requiere que `/technicians` devuelva un registro cuyo `userId` coincida con `/auth/me.id`.</small></div>;
  }

  return null;
}
