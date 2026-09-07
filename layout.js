'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error | sin-configurar
  const [productos, setProductos] = useState([]);
  const [totalProductos, setTotalProductos] = useState(null);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setEstado('sin-configurar');
      return;
    }

    async function cargar() {
      const { count, error: errorConteo } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      const { data, error: errorLista } = await supabase
        .from('productos')
        .select('nombre, unidad_inventario, precio_bruto_actual')
        .order('nombre')
        .limit(10);

      if (errorConteo || errorLista) {
        setMensajeError((errorConteo || errorLista).message);
        setEstado('error');
        return;
      }

      setTotalProductos(count);
      setProductos(data || []);
      setEstado('ok');
    }

    cargar();
  }, []);

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Abasto Mocca</h1>
      <p style={{ color: '#7A6F63', marginTop: 0 }}>
        Página de prueba: confirma que la aplicación ya está conectada a tu base de datos real.
      </p>

      {estado === 'cargando' && <p>Conectando con la base de datos...</p>}

      {estado === 'sin-configurar' && (
        <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
          <strong>Todavía falta conectar la base de datos.</strong>
          <p>
            Faltan las variables <code>NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Configúralas en Vercel (Project Settings
            → Environment Variables) con los datos de tu proyecto en Supabase (Project Settings
            → API) y vuelve a desplegar.
          </p>
        </div>
      )}

      {estado === 'error' && (
        <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
          <strong>No se pudo conectar con Supabase.</strong>
          <p>{mensajeError}</p>
        </div>
      )}

      {estado === 'ok' && (
        <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C' }}>
          <strong>¡Conectado! Se encontraron {totalProductos} productos en tu inventario.</strong>
          <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #C7DFC9' }}>
                <th style={{ padding: '6px 4px' }}>Producto</th>
                <th style={{ padding: '6px 4px' }}>Unidad</th>
                <th style={{ padding: '6px 4px' }}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.nombre} style={{ borderBottom: '1px solid #DCEEDD' }}>
                  <td style={{ padding: '6px 4px' }}>{p.nombre}</td>
                  <td style={{ padding: '6px 4px' }}>{p.unidad_inventario}</td>
                  <td style={{ padding: '6px 4px' }}>S/ {p.precio_bruto_actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: '#3E7A49' }}>(mostrando los primeros 10, ordenados por nombre)</p>
        </div>
      )}
    </main>
  );
}
