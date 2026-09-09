'use client';

import { useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function Login() {
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState('idle');
  const [usuario, setUsuario] = useState(null);

  function agregarDigito(d) {
    if (pin.length >= 4 || estado === 'verificando') return;
    setEstado('idle');
    setPin(pin + d);
  }

  function borrar() {
    setPin(pin.slice(0, -1));
    setEstado('idle');
  }

  async function ingresar() {
    if (pin.length !== 4 || !supabase) return;
    setEstado('verificando');

    const { data, error } = await supabase.rpc('login_con_pin', { pin_ingresado: pin });

    if (error || !data || data.length === 0) {
      setEstado('error');
      setPin('');
      return;
    }

    const user = data[0];
    localStorage.setItem('abasto_usuario', JSON.stringify(user));
    setUsuario(user);
    setEstado('ok');
  }

  if (estado === 'ok' && usuario) {
    return (
      <main style={estilos.contenedor}>
        <div style={estilos.tarjeta}>
          <h1 style={estilos.titulo}>¡Hola, {usuario.nombre}!</h1>
          <p style={{ color: '#7A6F63' }}>
            Entraste como <strong>{etiquetaRol(usuario.rol)}</strong>.
          </p>
          <p style={{ fontSize: 13, color: '#A79C8E' }}>
            (Las pantallas de cada rol vienen en el siguiente paso)
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={estilos.contenedor}>
      <div style={estilos.tarjeta}>
        <h1 style={estilos.titulo}>Abasto Mocca</h1>
        <p style={{ color: '#7A6F63', marginTop: 0 }}>Ingresa tu PIN de 4 dígitos</p>

        <div style={estilos.puntos}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{ ...estilos.punto, background: i < pin.length ? '#C1592B' : '#E7DDD3' }}
            />
          ))}
        </div>

        {estado === 'error' && (
          <p style={{ color: '#C1592B', fontWeight: 600 }}>PIN incorrecto, intenta de nuevo</p>
        )}

        <div style={estilos.teclado}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((tecla, i) =>
            tecla === '' ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => (tecla === '←' ? borrar() : agregarDigito(tecla))}
                style={estilos.tecla}
              >
                {tecla}
              </button>
            )
          )}
        </div>

        <button
          onClick={ingresar}
          disabled={pin.length !== 4 || estado === 'verificando'}
          style={{
            ...estilos.boton,
            opacity: pin.length === 4 && estado !== 'verificando' ? 1 : 0.5,
          }}
        >
          {estado === 'verificando' ? 'Verificando...' : 'Ingresar'}
        </button>
      </div>
    </main>
  );
}

function etiquetaRol(rol) {
  return (
    { trabajador: 'Trabajador / Solicitante', almacen: 'Responsable de Inventario', jefe_administrador: 'Jefe / Administrador' }[
      rol
    ] || rol
  );
}

const estilos = {
  contenedor: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  tarjeta: { width: '100%', maxWidth: 340, textAlign: 'center' },
  titulo: { fontSize: 26, marginBottom: 4, color: '#2B2320' },
  puntos: { display: 'flex', justifyContent: 'center', gap: 12, margin: '24px 0' },
  punto: { width: 16, height: 16, borderRadius: '50%' },
  teclado: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  tecla: { padding: '18px 0', fontSize: 20, borderRadius: 12, border: '1px solid #E7DDD3', background: '#fff', color: '#2B2320', cursor: 'pointer' },
  boton: { width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12, border: 'none', background: '#C1592B', color: '#fff', cursor: 'pointer' },
};
