import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { createUser } from './usersService';
import './users.css';

const ROLES = ['ADMINISTRADOR', 'TECNICO', 'CLIENTE'];

export default function UserCreatePage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setCreated(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: String(data.get('firstName') || '').trim(),
      lastName: String(data.get('lastName') || '').trim(),
      email: String(data.get('email') || '').trim(),
      password: String(data.get('password') || ''),
      role: String(data.get('role') || ''),
    };
    const phone = String(data.get('phone') || '').trim();
    if (phone) payload.phone = phone;
    setSubmitting(true);
    try {
      setCreated((await createUser(payload))?.data ?? null);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(getAdminApiErrorMessage(requestError, 'crear el usuario'));
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="users-page">
    <div className="admin-breadcrumb"><Link to="/admin/users">Usuarios</Link><span>›</span><strong>Crear usuario</strong></div>
    <div className="users-heading"><div><p className="admin-eyebrow">Alta administrativa</p><h1>Crear usuario</h1><p>Esta operación no habilita registro público.</p></div></div>
    {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
    {created && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>Usuario creado correctamente.</p><Link to={`/admin/users/${created.id}`}>Ver USR-{created.id}</Link></div>}
    <form className="user-form" onSubmit={handleSubmit}><div className="user-form-fields"><label className="user-field"><span>Nombre *</span><input name="firstName" maxLength="100" required disabled={submitting} /></label><label className="user-field"><span>Apellido *</span><input name="lastName" maxLength="100" required disabled={submitting} /></label><label className="user-field"><span>Correo *</span><input name="email" type="email" required disabled={submitting} /></label><label className="user-field"><span>Teléfono</span><input name="phone" maxLength="20" disabled={submitting} /></label><label className="user-field"><span>Contraseña temporal *</span><input name="password" type="password" minLength="8" maxLength="200" autoComplete="new-password" required disabled={submitting} /></label><label className="user-field"><span>Rol *</span><select name="role" defaultValue="" required disabled={submitting}><option value="">Selecciona un rol</option>{ROLES.map((role) => <option value={role} key={role}>{role}</option>)}</select></label></div><footer><button className="admin-button admin-button--primary" type="submit" disabled={submitting}>{submitting ? 'Creando...' : 'Crear usuario'}</button><Link className="admin-button admin-button--secondary" to="/admin/users">Cancelar</Link></footer></form>
  </section>;
}
