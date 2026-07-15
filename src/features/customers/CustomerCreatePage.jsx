import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { createUser } from '../users/usersService';
import { createCustomer } from './customersService';
import './customers.css';

function readData(response) {
  return response?.data ?? response;
}

export default function CustomerCreatePage() {
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [partialCreation, setPartialCreation] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setPartialCreation(false);
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    const firstName = form.get('firstName').trim();
    const lastName = form.get('lastName').trim();
    const phone = form.get('phone').trim();
    const email = form.get('email').trim();
    const password = form.get('password');
    const address = form.get('address').trim();
    let userWasCreated = false;

    try {
      setStage('Creando usuario con rol CLIENTE…');
      const userResponse = await createUser({
        firstName,
        lastName,
        phone: phone || null,
        email,
        password,
        role: 'CLIENTE',
      });

      userWasCreated = true;
      const userId = readData(userResponse)?.id;

      if (userId === null || userId === undefined) {
        throw new Error('El usuario fue creado, pero la API no devolvió su identificador.');
      }

      setStage('Creando perfil de cliente…');
      await createCustomer({
        userId,
        address: address || null,
      });

      formRef.current?.reset();
      setSuccess(true);
      setStage('');
    } catch (requestError) {
      setPartialCreation(userWasCreated);
      setError(getApiErrorMessage(
        requestError,
        'No fue posible completar el registro del cliente.',
      ));
      setStage('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="customer-create-page">
      <div className="admin-breadcrumb" aria-label="Ruta actual">
        <span>Panel principal</span>
        <span aria-hidden="true">›</span>
        <Link to="/admin/customers">Clientes</Link>
        <span aria-hidden="true">›</span>
        <strong>Registrar cliente</strong>
      </div>

      <div className="customers-heading customer-create-heading">
        <div>
          <p className="admin-eyebrow">Gestión de clientes</p>
          <h1>Registrar cliente</h1>
          <p>Crea primero el usuario y después su perfil de cliente asociado.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">!</span>
          <p>
            <strong>{partialCreation ? 'Registro incompleto. ' : ''}</strong>
            {partialCreation
              ? `El usuario fue creado, pero el perfil customer no pudo completarse. ${error}`
              : error}
          </p>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert--success" role="status">
          <span aria-hidden="true">✓</span>
          <p><strong>Cliente registrado correctamente.</strong> El usuario y su perfil quedaron asociados.</p>
          <Link to="/admin/customers">Ver clientes</Link>
        </div>
      )}

      <div className="customer-create-grid">
        <form ref={formRef} className="customer-form" onSubmit={handleSubmit}>
          <div className="customer-form__header">
            <div>
              <h2>Información del cliente</h2>
              <p>Los campos marcados con * son obligatorios.</p>
            </div>
            <span className="customer-role-badge">Rol: CLIENTE</span>
          </div>

          <fieldset disabled={submitting}>
            <legend className="sr-only">Datos del usuario y cliente</legend>
            <div className="customer-form__grid">
              <label>
                <span>Nombre *</span>
                <input name="firstName" type="text" maxLength="100" autoComplete="given-name" required placeholder="Ej. Juan" />
              </label>
              <label>
                <span>Apellido *</span>
                <input name="lastName" type="text" maxLength="100" autoComplete="family-name" required placeholder="Ej. Pérez" />
              </label>
              <label>
                <span>Teléfono <small>(opcional)</small></span>
                <input name="phone" type="tel" maxLength="20" autoComplete="tel" placeholder="Ej. 961 000 0000" />
              </label>
              <label>
                <span>Correo electrónico *</span>
                <input name="email" type="email" maxLength="150" autoComplete="email" required placeholder="cliente@ejemplo.com" />
              </label>
              <label className="customer-form__full">
                <span>Contraseña temporal *</span>
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  maxLength="200"
                  autoComplete="new-password"
                  required
                  placeholder="Mínimo 8 caracteres"
                />
                <small>Se envía únicamente al backend y no se guarda en el navegador.</small>
              </label>
              <label className="customer-form__full">
                <span>Dirección <small>(opcional)</small></span>
                <textarea name="address" maxLength="255" rows="3" autoComplete="street-address" placeholder="Calle, número, colonia, ciudad" />
              </label>
            </div>
          </fieldset>

          {stage && <p className="customer-form__progress" role="status">{stage}</p>}

          <div className="customer-form__actions">
            <Link className="admin-button admin-button--secondary" to="/admin/customers">
              Cancelar
            </Link>
            <button className="admin-button admin-button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </form>

        <aside className="customer-create-help">
          <div className="customer-create-help__dark">
            <span aria-hidden="true">i</span>
            <h2>Proceso de registro</h2>
            <ol>
              <li>Se crea un usuario con rol CLIENTE.</li>
              <li>Se usa el ID devuelto para crear el perfil customer.</li>
            </ol>
            <p>Si el segundo paso falla, el usuario permanece creado y no se realiza un rollback automático.</p>
          </div>
          <div className="customer-create-help__card">
            <span>Seguridad</span>
            <strong>Acceso administrativo</strong>
            <p>El backend valida el JWT y el rol ADMINISTRADOR en ambos endpoints.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
