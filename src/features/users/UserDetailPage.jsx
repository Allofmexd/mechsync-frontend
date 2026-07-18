import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { changeUserRole, getUserById, resetUserPassword, updateUser } from './usersService';
import './users.css';

const ROLES = ['ADMINISTRADOR', 'TECNICO', 'CLIENTE'];

function unwrap(response) { return response?.data ?? response; }

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadUser() {
    setLoading(true);
    setError('');
    try { setUser(unwrap(await getUserById(id))); }
    catch (requestError) { setError(getAdminApiErrorMessage(requestError, 'cargar el usuario')); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadUser(); }, [id]);

  async function handleBasicUpdate(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { firstName: String(data.get('firstName') || '').trim(), lastName: String(data.get('lastName') || '').trim(), email: String(data.get('email') || '').trim(), phone: String(data.get('phone') || '').trim() || null };
    setWorking('basic'); setError(''); setSuccess('');
    try { setUser(unwrap(await updateUser(id, payload))); setSuccess('Datos básicos actualizados correctamente.'); }
    catch (requestError) { setError(getAdminApiErrorMessage(requestError, 'actualizar el usuario')); }
    finally { setWorking(''); }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = String(new FormData(form).get('newPassword') || '');
    if (!window.confirm('¿Confirmas el restablecimiento de contraseña? La contraseña actual no puede consultarse.')) return;
    setWorking('password'); setError(''); setSuccess('');
    try { await resetUserPassword(id, password); form.reset(); setSuccess('Contraseña restablecida correctamente.'); }
    catch (requestError) { setError(getAdminApiErrorMessage(requestError, 'restablecer la contraseña')); }
    finally { setWorking(''); }
  }

  async function handleRoleChange(event) {
    event.preventDefault();
    const role = String(new FormData(event.currentTarget).get('role') || '');
    if (!window.confirm(`¿Confirmas cambiar el rol del usuario a ${role}?`)) return;
    setWorking('role'); setError(''); setSuccess('');
    try { setUser(unwrap(await changeUserRole(id, role))); setSuccess('Rol actualizado correctamente.'); }
    catch (requestError) { setError(getAdminApiErrorMessage(requestError, 'cambiar el rol')); }
    finally { setWorking(''); }
  }

  if (loading) return <div className="users-state">Cargando usuario...</div>;
  if (!user && error) return <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>;
  if (!user) return <div className="users-state">Usuario no encontrado.</div>;

  return <section className="users-page"><div className="admin-breadcrumb"><Link to="/admin/users">Usuarios</Link><span>›</span><strong>USR-{user.id}</strong></div><div className="users-heading"><div><p className="admin-eyebrow">Cuenta administrativa</p><h1>{user.firstName} {user.lastName}</h1><p>{user.email}</p></div><div className="users-roles">{(user.roles ?? []).map((role) => <span key={role}>{role}</span>)}</div></div>
    {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}{success && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>{success}</p></div>}
    <div className="user-detail-grid"><form className="user-form" onSubmit={handleBasicUpdate}><header><h2>Datos básicos</h2></header><div className="user-form-fields"><label className="user-field"><span>Nombre *</span><input name="firstName" defaultValue={user.firstName} required disabled={Boolean(working)} /></label><label className="user-field"><span>Apellido *</span><input name="lastName" defaultValue={user.lastName} required disabled={Boolean(working)} /></label><label className="user-field"><span>Correo *</span><input name="email" type="email" defaultValue={user.email} required disabled={Boolean(working)} /></label><label className="user-field"><span>Teléfono</span><input name="phone" defaultValue={user.phone ?? ''} maxLength="20" disabled={Boolean(working)} /></label></div><footer><button className="admin-button admin-button--primary" type="submit" disabled={Boolean(working)}>{working === 'basic' ? 'Guardando...' : 'Guardar datos'}</button></footer></form>
      <div className="user-security"><form className="user-form" onSubmit={handleRoleChange}><header><h2>Cambiar rol</h2></header><div className="user-form-fields user-form-fields--single"><label className="user-field"><span>Rol *</span><select name="role" defaultValue={user.roles?.[0] ?? ''} required disabled={Boolean(working)}>{ROLES.map((role) => <option value={role} key={role}>{role}</option>)}</select></label></div><footer><button className="admin-button admin-button--secondary" type="submit" disabled={Boolean(working)}>{working === 'role' ? 'Actualizando...' : 'Cambiar rol'}</button></footer></form>
        <form className="user-form" onSubmit={handlePasswordReset}><header><h2>Restablecer contraseña</h2></header><div className="user-form-fields user-form-fields--single"><label className="user-field"><span>Nueva contraseña *</span><input name="newPassword" type="password" minLength="8" maxLength="200" autoComplete="new-password" required disabled={Boolean(working)} /></label><p>La contraseña actual y su hash nunca se consultan ni se muestran.</p></div><footer><button className="admin-button admin-button--secondary" type="submit" disabled={Boolean(working)}>{working === 'password' ? 'Restableciendo...' : 'Restablecer contraseña'}</button></footer></form></div></div>
  </section>;
}
