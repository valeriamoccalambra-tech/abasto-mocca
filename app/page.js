'use client';

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

const ETIQUETA_ROL = {
  trabajador: 'Trabajador / Solicitante',
  almacen: 'Responsable de Inventario',
  jefe_administrador: 'Jefe / Administrador',
};

const ETIQUETA_UNIDAD = { kg: 'kg', litro: 'L', unidad: 'un' };

export default function App() {
  const [pantalla, setPantalla] = useState('cargando'); // cargando | login | home | stock
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('abasto_usuario');
      if (guardado) {
        setUsuario(JSON.parse(guardado));
        setPantalla('home');
        return;
      }
    } catch (e) {
      // si el dato guardado está corrupto, simplemente pedimos login de nuevo
    }
    setPantalla('login');
  }, []);

  function alIngresar(user) {
    localStorage.setItem('abasto_usuario', JSON.stringify(user));
    setUsuario(user);
    setPantalla('home');
  }

  function cerrarSesion() {
    localStorage.removeItem('abasto_usuario');
    setUsuario(null);
    setPantalla('login');
  }

  if (pantalla === 'cargando') return null;
  if (pantalla === 'login') return <Login onIngresar={alIngresar} />;
  if (pantalla === 'stock')
    return <Stock onVolver={() => setPantalla('home')} onCerrarSesion={cerrarSesion} />;
  return <Home usuario={usuario} onVerStock={() => setPantalla('stock')} onCerrarSesion={cerrarSesion} />;
}

// ============================================================
// LOGIN
// ============================================================

function Login({ onIngresar }) {
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState('idle'); // idle | verificando | error

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

    onIngresar(data[0]);
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
          style={{ ...estilos.boton, opacity: pin.length === 4 && estado !== 'verificando' ? 1 : 0.5 }}
        >
          {estado === 'verificando' ? 'Verificando...' : 'Ingresar'}
        </button>
      </div>
    </main>
  );
}

// ============================================================
// HOME — pantalla de tareas (no un menú): lo primero que se ve
// es lo que hay que hacer, no una lista de opciones para elegir.
// ============================================================

function Home({ usuario, onVerStock, onCerrarSesion }) {
  const [resumen, setResumen] = useState(null); // { criticos, porPedir } | 'error' | null (cargando)

  const puedeVerAlmacen = usuario.rol === 'almacen' || usuario.rol === 'jefe_administrador';

  useEffect(() => {
    if (!puedeVerAlmacen || !supabase) return;

    async function cargar() {
      const { data, error } = await supabase.from('vw_alertas_stock').select('nivel_alerta');
      if (error) {
        setResumen('error');
        return;
      }
      const criticos = data.filter((r) => r.nivel_alerta === 'CRITICA').length;
      const porPedir = data.filter((r) => r.nivel_alerta === 'REORDEN').length;
      setResumen({ criticos, porPedir });
    }

    cargar();
  }, [puedeVerAlmacen]);

  return (
    <main style={estilos.contenedor}>
      <div style={{ ...estilos.tarjeta, maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Hola, {usuario.nombre}</h1>
          <button onClick={onCerrarSesion} style={estilos.enlace}>
            Cerrar sesión
          </button>
        </div>
        <p style={{ color: '#7A6F63', marginTop: 0, textAlign: 'left' }}>
          {ETIQUETA_ROL[usuario.rol] || usuario.rol}
        </p>

        {puedeVerAlmacen ? (
          <button onClick={onVerStock} style={estilos.tareaCard}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>Ver stock</div>
              <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                Qué hay que reponer ahora mismo
              </div>
            </div>
            {resumen && resumen !== 'error' && resumen.criticos > 0 && (
              <span style={{ ...estilos.badge, background: '#C1592B' }}>{resumen.criticos} crítico</span>
            )}
            {resumen && resumen !== 'error' && resumen.criticos === 0 && resumen.porPedir > 0 && (
              <span style={{ ...estilos.badge, background: '#D9A441' }}>{resumen.porPedir} por pedir</span>
            )}
          </button>
        ) : (
          <p style={{ color: '#7A6F63' }}>
            Todavía no hay pantallas para tu rol. Muy pronto vas a poder hacer tus pedidos desde aquí.
          </p>
        )}

        <div style={{ ...estilos.tareaCard, opacity: 0.55, cursor: 'default' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Pedidos</div>
            <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>Próximamente</div>
          </div>
        </div>

        <div style={{ ...estilos.tareaCard, opacity: 0.55, cursor: 'default' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Registrar entrada</div>
            <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>Próximamente</div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// STOCK — lista de productos, ordenada por urgencia, con semáforo.
// ============================================================

function Stock({ onVolver, onCerrarSesion }) {
  const [estado, setEstado] = useState('cargando'); // cargando | error | ok
  const [productos, setProductos] = useState([]);
  const [mensajeError, setMensajeError] = useState('');
  const [verTodo, setVerTodo] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setEstado('error');
      setMensajeError('Falta configurar la conexión con la base de datos.');
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from('vw_alertas_stock')
        .select('producto_id, nombre, unidad_inventario, stock_actual, punto_reorden, nivel_alerta')
        .order('nombre');

      if (error) {
        setMensajeError(error.message);
        setEstado('error');
        return;
      }

      const orden = { CRITICA: 0, REORDEN: 1, OK: 2 };
      const ordenados = [...data].sort((a, b) => orden[a.nivel_alerta] - orden[b.nivel_alerta]);
      setProductos(ordenados);
      setEstado('ok');
    }

    cargar();
  }, []);

  const criticos = productos.filter((p) => p.nivel_alerta === 'CRITICA');
  const porPedir = productos.filter((p) => p.nivel_alerta === 'REORDEN');
  const ok = productos.filter((p) => p.nivel_alerta === 'OK');
  const visibles = verTodo ? productos : [...criticos, ...porPedir];

  return (
    <main style={estilos.contenedor}>
      <div style={{ ...estilos.tarjeta, maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <button onClick={onVolver} style={estilos.enlace}>
            ← Volver
          </button>
          <button onClick={onCerrarSesion} style={estilos.enlace}>
            Cerrar sesión
          </button>
        </div>
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Stock</h1>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>No se pudo cargar el stock.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'ok' && (
          <>
            {criticos.length === 0 && porPedir.length === 0 && (
              <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginBottom: 12 }}>
                No hay nada urgente por reponer ahora mismo.
              </div>
            )}

            {visibles.map((p) => (
              <ProductoCard key={p.producto_id} p={p} />
            ))}

            {!verTodo && ok.length > 0 && (
              <button onClick={() => setVerTodo(true)} style={{ ...estilos.enlace, marginTop: 8 }}>
                Ver los {ok.length} productos que están OK
              </button>
            )}
            {verTodo && (
              <button onClick={() => setVerTodo(false)} style={{ ...estilos.enlace, marginTop: 8 }}>
                Ocultar los que están OK
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ProductoCard({ p }) {
  const color = { CRITICA: '#C1592B', REORDEN: '#D9A441', OK: '#3E7A49' }[p.nivel_alerta];
  const texto = { CRITICA: 'Crítico', REORDEN: 'Por pedir', OK: 'OK' }[p.nivel_alerta];
  const unidad = ETIQUETA_UNIDAD[p.unidad_inventario] || p.unidad_inventario;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        marginBottom: 8,
        borderRadius: 10,
        border: '1px solid #E7DDD3',
        borderLeft: `5px solid ${color}`,
        background: '#fff',
        textAlign: 'left',
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
        <div style={{ fontSize: 13, color: '#7A6F63' }}>
          Stock: {formatoNumero(p.stock_actual)} {unidad} · Punto de reorden:{' '}
          {formatoNumero(p.punto_reorden)} {unidad}
        </div>
      </div>
      <span style={{ ...estilos.badge, background: color, flexShrink: 0 }}>{texto}</span>
    </div>
  );
}

function formatoNumero(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('es-PE', { maximumFractionDigits: 1 });
}

// ============================================================
// ESTILOS
// ============================================================

const estilos = {
  contenedor: { minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' },
  tarjeta: { width: '100%', maxWidth: 340, textAlign: 'center' },
  titulo: { fontSize: 26, marginBottom: 4, color: '#2B2320' },
  puntos: { display: 'flex', justifyContent: 'center', gap: 12, margin: '24px 0' },
  punto: { width: 16, height: 16, borderRadius: '50%' },
  teclado: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  tecla: { padding: '18px 0', fontSize: 20, borderRadius: 12, border: '1px solid #E7DDD3', background: '#fff', color: '#2B2320', cursor: 'pointer' },
  boton: { width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12, border: 'none', background: '#C1592B', color: '#fff', cursor: 'pointer' },
  enlace: { background: 'none', border: 'none', color: '#C1592B', fontSize: 14, cursor: 'pointer', padding: 0 },
  tareaCard: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    padding: '16px 16px',
    marginTop: 16,
    borderRadius: 14,
    border: '1px solid #E7DDD3',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
  },
  badge: { color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' },
};
