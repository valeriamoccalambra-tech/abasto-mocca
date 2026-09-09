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
  const [pantalla, setPantalla] = useState('cargando'); // cargando | login | home | stock | ...
  const [usuario, setUsuario] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

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
  if (pantalla === 'entrada')
    return <Entrada usuario={usuario} onVolver={() => setPantalla('home')} onCerrarSesion={cerrarSesion} />;
  if (pantalla === 'proveedores')
    return <Proveedores onVolver={() => setPantalla('home')} onCerrarSesion={cerrarSesion} />;
  if (pantalla === 'orden_nueva')
    return <NuevaOrden usuario={usuario} onVolver={() => setPantalla('home')} onCerrarSesion={cerrarSesion} />;
  if (pantalla === 'ordenes_pendientes')
    return (
      <OrdenesPendientes
        onVolver={() => setPantalla('home')}
        onCerrarSesion={cerrarSesion}
        onAbrirOrden={(id) => {
          setOrdenSeleccionada(id);
          setPantalla('recibir_orden');
        }}
      />
    );
  if (pantalla === 'recibir_orden')
    return (
      <RecibirOrden
        usuario={usuario}
        ordenId={ordenSeleccionada}
        onVolver={() => setPantalla('ordenes_pendientes')}
        onCerrarSesion={cerrarSesion}
      />
    );
  if (pantalla === 'pedido_nuevo')
    return <HacerPedido usuario={usuario} onVolver={() => setPantalla('home')} onCerrarSesion={cerrarSesion} />;
  if (pantalla === 'mis_pedidos')
    return (
      <MisPedidos
        usuario={usuario}
        onVolver={() => setPantalla('home')}
        onCerrarSesion={cerrarSesion}
        onAbrirPedido={(id) => {
          setPedidoSeleccionado(id);
          setPantalla('pedido_detalle');
        }}
      />
    );
  if (pantalla === 'pedido_detalle')
    return (
      <DetallePedido
        pedidoId={pedidoSeleccionado}
        onVolver={() => setPantalla('mis_pedidos')}
        onCerrarSesion={cerrarSesion}
      />
    );
  if (pantalla === 'pedidos_atender')
    return (
      <PedidosPorAtender
        onVolver={() => setPantalla('home')}
        onCerrarSesion={cerrarSesion}
        onAbrirPedido={(id) => {
          setPedidoSeleccionado(id);
          setPantalla('atender_pedido');
        }}
      />
    );
  if (pantalla === 'atender_pedido')
    return (
      <AtenderPedido
        pedidoId={pedidoSeleccionado}
        onVolver={() => setPantalla('pedidos_atender')}
        onCerrarSesion={cerrarSesion}
      />
    );
  return (
    <Home
      usuario={usuario}
      onVerStock={() => setPantalla('stock')}
      onRegistrarEntrada={() => setPantalla('entrada')}
      onProveedores={() => setPantalla('proveedores')}
      onNuevaOrden={() => setPantalla('orden_nueva')}
      onOrdenesPendientes={() => setPantalla('ordenes_pendientes')}
      onHacerPedido={() => setPantalla('pedido_nuevo')}
      onMisPedidos={() => setPantalla('mis_pedidos')}
      onPedidosAtender={() => setPantalla('pedidos_atender')}
      onCerrarSesion={cerrarSesion}
    />
  );
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

function Home({
  usuario,
  onVerStock,
  onRegistrarEntrada,
  onProveedores,
  onNuevaOrden,
  onOrdenesPendientes,
  onHacerPedido,
  onMisPedidos,
  onPedidosAtender,
  onCerrarSesion,
}) {
  const [resumen, setResumen] = useState(null); // { criticos, porPedir } | 'error' | null (cargando)
  const [ordenesPendientes, setOrdenesPendientes] = useState(null); // numero | 'error' | null (cargando)
  const [pedidosPorAtender, setPedidosPorAtender] = useState(null); // numero | 'error' | null (cargando)
  const [pedidosPorConfirmar, setPedidosPorConfirmar] = useState(null); // numero | 'error' | null (cargando)

  const puedeVerAlmacen = usuario.rol === 'almacen' || usuario.rol === 'jefe_administrador';

  useEffect(() => {
    if (!supabase) return;

    async function cargarMisPedidos() {
      const { data, error } = await supabase
        .from('vw_mis_pedidos')
        .select('estado')
        .eq('solicitante_id', usuario.id);
      if (error) {
        setPedidosPorConfirmar('error');
        return;
      }
      setPedidosPorConfirmar(data.filter((p) => p.estado === 'enviado_almacen').length);
    }

    cargarMisPedidos();

    if (!puedeVerAlmacen) return;

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

    async function cargarOrdenes() {
      const { data, error } = await supabase.from('vw_ordenes_pendientes').select('orden_id');
      if (error) {
        setOrdenesPendientes('error');
        return;
      }
      setOrdenesPendientes(data.length);
    }

    async function cargarPedidosAtender() {
      const { data, error } = await supabase.from('vw_pedidos_por_atender').select('pedido_id');
      if (error) {
        setPedidosPorAtender('error');
        return;
      }
      setPedidosPorAtender(data.length);
    }

    cargar();
    cargarOrdenes();
    cargarPedidosAtender();
  }, [puedeVerAlmacen, usuario.id]);

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

        <button onClick={onHacerPedido} style={estilos.tareaCard}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Hacer pedido</div>
            <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>Pedir materiales al almacén</div>
          </div>
        </button>

        <button onClick={onMisPedidos} style={estilos.tareaCard}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Mis pedidos</div>
            <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>Ver estado, confirmar lo que llegó</div>
          </div>
          {pedidosPorConfirmar !== null && pedidosPorConfirmar !== 'error' && pedidosPorConfirmar > 0 && (
            <span style={{ ...estilos.badge, background: '#3E7A49' }}>{pedidosPorConfirmar} por confirmar</span>
          )}
        </button>

        {puedeVerAlmacen && (
          <button onClick={onVerStock} style={{ ...estilos.tareaCard, marginTop: 24 }}>
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
        )}

        {puedeVerAlmacen && (
          <button onClick={onPedidosAtender} style={estilos.tareaCard}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>Pedidos por atender</div>
              <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>Lo que piden los trabajadores</div>
            </div>
            {pedidosPorAtender !== null && pedidosPorAtender !== 'error' && pedidosPorAtender > 0 && (
              <span style={{ ...estilos.badge, background: '#C1592B' }}>{pedidosPorAtender}</span>
            )}
          </button>
        )}

        {puedeVerAlmacen && (
          <button onClick={onOrdenesPendientes} style={estilos.tareaCard}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>Recibir mercadería</div>
              <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                Órdenes de compra a la espera de llegar
              </div>
            </div>
            {ordenesPendientes !== null && ordenesPendientes !== 'error' && ordenesPendientes > 0 && (
              <span style={{ ...estilos.badge, background: '#3E7A49' }}>{ordenesPendientes}</span>
            )}
          </button>
        )}

        {puedeVerAlmacen && (
          <>
            <button onClick={onNuevaOrden} style={{ ...estilos.tareaCard, marginTop: 24 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>Nueva orden de compra</div>
                <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                  Registrar qué se pidió a un proveedor
                </div>
              </div>
            </button>

            <button onClick={onRegistrarEntrada} style={estilos.tareaCard}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>Registrar entrada suelta</div>
                <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                  Cuando llega algo sin una orden de compra
                </div>
              </div>
            </button>

            <button onClick={onProveedores} style={estilos.tareaCard}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>Proveedores</div>
                <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                  Quién concentra más productos y cuánto le compramos
                </div>
              </div>
            </button>
          </>
        )}
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

// Aviso de si el precio subió, bajó o quedó igual respecto a la última
// compra registrada de ese producto. Se usa tanto en Registrar entrada
// como al recibir una orden de compra.
function MensajePrecio({ comparacion, precioAnterior, precioNuevo }) {
  if (comparacion === 'sin_dato') {
    return (
      <div style={{ background: '#EFEBE6', padding: 16, borderRadius: 8, color: '#5C5248', marginBottom: 12, textAlign: 'left' }}>
        Primera vez que se registra un precio para este producto.
      </div>
    );
  }

  const info = {
    subio: { bg: '#FDF3E3', color: '#7A5A16', texto: 'El precio subió' },
    bajo: { bg: '#EAF6EC', color: '#1E5C2C', texto: 'El precio bajó' },
    igual: { bg: '#EFEBE6', color: '#5C5248', texto: 'El precio quedó igual' },
  }[comparacion];

  if (!info) return null;

  return (
    <div style={{ background: info.bg, padding: 16, borderRadius: 8, color: info.color, marginBottom: 12, textAlign: 'left' }}>
      <strong>{info.texto}</strong>
      <p style={{ marginBottom: 0 }}>
        Antes: S/ {formatoNumero(precioAnterior)} · Ahora: S/ {formatoNumero(precioNuevo)}
      </p>
    </div>
  );
}

// ============================================================
// REGISTRAR ENTRADA — un paso a la vez: buscar producto,
// completar los datos, confirmar. Sin texto libre salvo lo opcional.
// ============================================================

function Entrada({ usuario, onVolver, onCerrarSesion }) {
  const [paso, setPaso] = useState('cargando'); // cargando | buscar | detalle | guardando | exito | error
  const [mensajeError, setMensajeError] = useState('');
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [razonesSociales, setRazonesSociales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [productoElegido, setProductoElegido] = useState(null);

  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [razonSocialId, setRazonSocialId] = useState('');
  const [comprobante, setComprobante] = useState('');

  const [resultado, setResultado] = useState(null); // { comparacion, precioAnterior }

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setPaso('error');
      return;
    }

    async function cargar() {
      const [rProductos, rProveedores, rRazones] = await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, unidad_inventario, precio_bruto_actual, proveedor_principal_id')
          .eq('activo', true)
          .order('nombre'),
        supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
        supabase.from('razones_sociales').select('id, nombre').eq('activo', true).order('nombre'),
      ]);

      if (rProductos.error || rProveedores.error || rRazones.error) {
        setMensajeError((rProductos.error || rProveedores.error || rRazones.error).message);
        setPaso('error');
        return;
      }

      setProductos(rProductos.data || []);
      setProveedores(rProveedores.data || []);
      setRazonesSociales(rRazones.data || []);
      setPaso('buscar');
    }

    cargar();
  }, []);

  function elegirProducto(p) {
    setProductoElegido(p);
    setCantidad('');
    setPrecio(p.precio_bruto_actual != null ? String(p.precio_bruto_actual) : '');
    setProveedorId(p.proveedor_principal_id || '');
    setRazonSocialId('');
    setComprobante('');
    setPaso('detalle');
  }

  function volverABuscar() {
    setBusqueda('');
    setProductoElegido(null);
    setPaso('buscar');
  }

  async function guardar() {
    const cantidadNum = Number(cantidad);
    const precioNum = Number(precio);
    if (!cantidadNum || cantidadNum <= 0 || Number.isNaN(precioNum) || precioNum < 0) return;

    setPaso('guardando');

    const { data, error } = await supabase.rpc('registrar_entrada', {
      p_producto_id: productoElegido.id,
      p_cantidad: cantidadNum,
      p_precio_unitario: precioNum,
      p_proveedor_id: proveedorId || null,
      p_razon_social_id: razonSocialId || null,
      p_nro_comprobante: comprobante || null,
      p_usuario_id: usuario?.id || null,
    });

    if (error || !data || data.length === 0) {
      setMensajeError(error ? error.message : 'No se pudo guardar la entrada.');
      setPaso('error');
      return;
    }

    setResultado({ comparacion: data[0].comparacion, precioAnterior: data[0].precio_anterior });
    setPaso('exito');
  }

  const unidad = productoElegido ? ETIQUETA_UNIDAD[productoElegido.unidad_inventario] || productoElegido.unidad_inventario : '';

  const resultadosBusqueda =
    busqueda.trim().length === 0
      ? []
      : productos
          .filter((p) => p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
          .slice(0, 8);

  return (
    <main style={estilos.contenedor}>
      <div style={{ ...estilos.tarjeta, maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <button onClick={paso === 'detalle' ? volverABuscar : onVolver} style={estilos.enlace}>
            ← Volver
          </button>
          <button onClick={onCerrarSesion} style={estilos.enlace}>
            Cerrar sesión
          </button>
        </div>
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Registrar entrada</h1>

        {paso === 'cargando' && <p>Cargando productos...</p>}

        {paso === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>Algo no funcionó.</strong>
            <p style={{ marginBottom: 8 }}>{mensajeError}</p>
            <button onClick={() => setPaso('buscar')} style={estilos.enlace}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {paso === 'buscar' && (
          <>
            <p style={{ color: '#7A6F63', marginTop: 0, textAlign: 'left' }}>
              Paso 1 de 2 · Busca el producto que llegó
            </p>
            <input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escribe el nombre del producto..."
              style={estilos.input}
            />
            {resultadosBusqueda.map((p) => (
              <button key={p.id} onClick={() => elegirProducto(p)} style={estilos.opcionCard}>
                {p.nombre}
              </button>
            ))}
            {busqueda.trim().length > 0 && resultadosBusqueda.length === 0 && (
              <p style={{ color: '#7A6F63' }}>No se encontró ningún producto con ese nombre.</p>
            )}
          </>
        )}

        {(paso === 'detalle' || paso === 'guardando') && productoElegido && (
          <>
            <p style={{ color: '#7A6F63', marginTop: 0, textAlign: 'left' }}>
              Paso 2 de 2 · {productoElegido.nombre}
            </p>

            <label style={estilos.etiquetaCampo}>Cantidad que llegó ({unidad})</label>
            <input
              type="number"
              inputMode="decimal"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
              style={estilos.input}
            />

            <label style={estilos.etiquetaCampo}>Precio pagado por {unidad === 'un' ? 'unidad' : unidad}</label>
            <input
              type="number"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              style={estilos.input}
            />

            <label style={estilos.etiquetaCampo}>Proveedor</label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={estilos.input}>
              <option value="">(sin especificar)</option>
              {proveedores.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.nombre}
                </option>
              ))}
            </select>

            <label style={estilos.etiquetaCampo}>Razón social</label>
            <select value={razonSocialId} onChange={(e) => setRazonSocialId(e.target.value)} style={estilos.input}>
              <option value="">(sin especificar)</option>
              {razonesSociales.map((rs) => (
                <option key={rs.id} value={rs.id}>
                  {rs.nombre}
                </option>
              ))}
            </select>

            <label style={estilos.etiquetaCampo}>Número de comprobante (opcional)</label>
            <input
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              placeholder="F001-000123"
              style={estilos.input}
            />

            <button
              onClick={guardar}
              disabled={paso === 'guardando' || !cantidad || Number(cantidad) <= 0 || precio === ''}
              style={{
                ...estilos.boton,
                marginTop: 12,
                opacity: paso === 'guardando' || !cantidad || Number(cantidad) <= 0 || precio === '' ? 0.5 : 1,
              }}
            >
              {paso === 'guardando' ? 'Guardando...' : 'Guardar entrada'}
            </button>
          </>
        )}

        {paso === 'exito' && productoElegido && (
          <>
            <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginBottom: 12, textAlign: 'left' }}>
              <strong>Entrada registrada.</strong>
              <p style={{ marginBottom: 0 }}>
                {formatoNumero(cantidad)} {unidad} de {productoElegido.nombre}.
              </p>
            </div>

            {resultado && (
              <MensajePrecio comparacion={resultado.comparacion} precioAnterior={resultado.precioAnterior} precioNuevo={precio} />
            )}

            <button onClick={volverABuscar} style={estilos.boton}>
              Registrar otra entrada
            </button>
            <button onClick={onVolver} style={{ ...estilos.enlace, marginTop: 14 }}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ============================================================
// PROVEEDORES — qué proveedor concentra más productos (poder de
// negociación) y cuánto se le ha comprado en total.
// ============================================================

function Proveedores({ onVolver, onCerrarSesion }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [proveedores, setProveedores] = useState([]);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from('vw_proveedores_concentracion')
        .select('proveedor_id, nombre, cantidad_productos, total_comprado');

      if (error) {
        setMensajeError(error.message);
        setEstado('error');
        return;
      }

      setProveedores(data || []);
      setEstado('ok');
    }

    cargar();
  }, []);

  const maxProductos = Math.max(1, ...proveedores.map((p) => p.cantidad_productos));

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Proveedores</h1>
        <p style={{ color: '#7A6F63', marginTop: 0, textAlign: 'left', fontSize: 13 }}>
          Ordenados por cuántos productos les compras. Mientras más productos dependen de un mismo
          proveedor, menos margen tienes para negociar precio con él.
        </p>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>No se pudo cargar.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'ok' &&
          proveedores.map((p) => (
            <div key={p.proveedor_id} style={{ ...estilos.opcionCard, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>{p.nombre}</span>
                <span>
                  {p.cantidad_productos} producto{p.cantidad_productos === 1 ? '' : 's'}
                </span>
              </div>
              <div style={{ background: '#F1EAE0', borderRadius: 999, height: 8, marginTop: 8, marginBottom: 6 }}>
                <div
                  style={{
                    width: `${(p.cantidad_productos / maxProductos) * 100}%`,
                    background: '#C1592B',
                    height: 8,
                    borderRadius: 999,
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: '#7A6F63' }}>Comprado en total: S/ {formatoNumero(p.total_comprado)}</div>
            </div>
          ))}
      </div>
    </main>
  );
}

// ============================================================
// NUEVA ORDEN DE COMPRA — qué se pidió a un proveedor, antes de
// que llegue la mercadería.
// ============================================================

function NuevaOrden({ usuario, onVolver, onCerrarSesion }) {
  const [paso, setPaso] = useState('cargando'); // cargando | form | guardando | exito | error
  const [mensajeError, setMensajeError] = useState('');
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [razonesSociales, setRazonesSociales] = useState([]);

  const [proveedorId, setProveedorId] = useState('');
  const [razonSocialId, setRazonSocialId] = useState('');
  const [lineas, setLineas] = useState([]); // { producto_id, nombre, unidad, cantidad }

  const [busqueda, setBusqueda] = useState('');
  const [productoParaAgregar, setProductoParaAgregar] = useState(null);
  const [cantidadParaAgregar, setCantidadParaAgregar] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setPaso('error');
      return;
    }

    async function cargar() {
      const [rProductos, rProveedores, rRazones] = await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, unidad_inventario, proveedor_principal_id')
          .eq('activo', true)
          .order('nombre'),
        supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
        supabase.from('razones_sociales').select('id, nombre').eq('activo', true).order('nombre'),
      ]);

      if (rProductos.error || rProveedores.error || rRazones.error) {
        setMensajeError((rProductos.error || rProveedores.error || rRazones.error).message);
        setPaso('error');
        return;
      }

      setProductos(rProductos.data || []);
      setProveedores(rProveedores.data || []);
      setRazonesSociales(rRazones.data || []);
      setPaso('form');
    }

    cargar();
  }, []);

  const resultadosBusqueda =
    busqueda.trim().length === 0
      ? []
      : productos
          .filter((p) => p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
          .filter((p) => !lineas.some((l) => l.producto_id === p.id))
          .slice(0, 8);

  function confirmarLinea() {
    const cantidadNum = Number(cantidadParaAgregar);
    if (!cantidadNum || cantidadNum <= 0) return;
    setLineas([
      ...lineas,
      {
        producto_id: productoParaAgregar.id,
        nombre: productoParaAgregar.nombre,
        unidad: productoParaAgregar.unidad_inventario,
        cantidad: cantidadNum,
      },
    ]);
    setProductoParaAgregar(null);
    setCantidadParaAgregar('');
    setBusqueda('');
  }

  function quitarLinea(producto_id) {
    setLineas(lineas.filter((l) => l.producto_id !== producto_id));
  }

  async function crearOrden() {
    if (!proveedorId || lineas.length === 0) return;
    setPaso('guardando');

    const { error } = await supabase.rpc('crear_orden_compra', {
      p_proveedor_id: proveedorId,
      p_razon_social_id: razonSocialId || null,
      p_lineas: lineas.map((l) => ({ producto_id: l.producto_id, cantidad: l.cantidad })),
      p_usuario_id: usuario?.id || null,
    });

    if (error) {
      setMensajeError(error.message);
      setPaso('error');
      return;
    }

    setPaso('exito');
  }

  function empezarOtra() {
    setProveedorId('');
    setRazonSocialId('');
    setLineas([]);
    setBusqueda('');
    setProductoParaAgregar(null);
    setPaso('form');
  }

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Nueva orden de compra</h1>

        {paso === 'cargando' && <p>Cargando...</p>}

        {paso === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>Algo no funcionó.</strong>
            <p style={{ marginBottom: 8 }}>{mensajeError}</p>
            <button onClick={() => setPaso('form')} style={estilos.enlace}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {(paso === 'form' || paso === 'guardando') && (
          <>
            <label style={estilos.etiquetaCampo}>Proveedor</label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={estilos.input}>
              <option value="">Elige un proveedor...</option>
              {proveedores.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.nombre}
                </option>
              ))}
            </select>

            <label style={estilos.etiquetaCampo}>Razón social</label>
            <select value={razonSocialId} onChange={(e) => setRazonSocialId(e.target.value)} style={estilos.input}>
              <option value="">(sin especificar)</option>
              {razonesSociales.map((rs) => (
                <option key={rs.id} value={rs.id}>
                  {rs.nombre}
                </option>
              ))}
            </select>

            <label style={estilos.etiquetaCampo}>Productos pedidos</label>

            {lineas.map((l) => (
              <div
                key={l.producto_id}
                style={{ ...estilos.opcionCard, cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {l.nombre} — {formatoNumero(l.cantidad)} {ETIQUETA_UNIDAD[l.unidad] || l.unidad}
                </span>
                <button onClick={() => quitarLinea(l.producto_id)} style={{ ...estilos.enlace, fontSize: 18 }}>
                  ×
                </button>
              </div>
            ))}

            {productoParaAgregar ? (
              <div style={{ ...estilos.opcionCard, cursor: 'default' }}>
                <div style={{ marginBottom: 8 }}>{productoParaAgregar.nombre}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={cantidadParaAgregar}
                    onChange={(e) => setCantidadParaAgregar(e.target.value)}
                    placeholder={`Cantidad (${ETIQUETA_UNIDAD[productoParaAgregar.unidad_inventario] || productoParaAgregar.unidad_inventario})`}
                    style={{ ...estilos.input, marginBottom: 0 }}
                  />
                  <button
                    onClick={confirmarLinea}
                    disabled={!cantidadParaAgregar || Number(cantidadParaAgregar) <= 0}
                    style={{ ...estilos.boton, width: 'auto', padding: '0 16px' }}
                  >
                    Agregar
                  </button>
                </div>
                <button onClick={() => setProductoParaAgregar(null)} style={{ ...estilos.enlace, marginTop: 8 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Busca un producto para agregar..."
                  style={estilos.input}
                />
                {resultadosBusqueda.map((p) => (
                  <button key={p.id} onClick={() => setProductoParaAgregar(p)} style={estilos.opcionCard}>
                    {p.nombre}
                  </button>
                ))}
              </>
            )}

            <button
              onClick={crearOrden}
              disabled={paso === 'guardando' || !proveedorId || lineas.length === 0}
              style={{
                ...estilos.boton,
                marginTop: 16,
                opacity: paso === 'guardando' || !proveedorId || lineas.length === 0 ? 0.5 : 1,
              }}
            >
              {paso === 'guardando' ? 'Creando...' : `Crear orden (${lineas.length} producto${lineas.length === 1 ? '' : 's'})`}
            </button>
          </>
        )}

        {paso === 'exito' && (
          <>
            <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginBottom: 12, textAlign: 'left' }}>
              <strong>Orden creada.</strong>
              <p style={{ marginBottom: 0 }}>
                Cuando llegue la mercadería, la recibes desde "Recibir mercadería" en Inicio.
              </p>
            </div>
            <button onClick={empezarOtra} style={estilos.boton}>
              Crear otra orden
            </button>
            <button onClick={onVolver} style={{ ...estilos.enlace, marginTop: 14 }}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ============================================================
// ÓRDENES PENDIENTES — lista de órdenes de compra por recibir.
// ============================================================

function OrdenesPendientes({ onVolver, onCerrarSesion, onAbrirOrden }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [ordenes, setOrdenes] = useState([]);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from('vw_ordenes_pendientes')
        .select('orden_id, estado, fecha_pedido, proveedor_nombre, razon_social_nombre, lineas_pendientes, lineas_totales');

      if (error) {
        setMensajeError(error.message);
        setEstado('error');
        return;
      }

      setOrdenes(data || []);
      setEstado('ok');
    }

    cargar();
  }, []);

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Recibir mercadería</h1>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>No se pudo cargar.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'ok' && ordenes.length === 0 && (
          <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C' }}>
            No hay órdenes de compra pendientes de recibir.
          </div>
        )}

        {estado === 'ok' &&
          ordenes.map((o) => (
            <button key={o.orden_id} onClick={() => onAbrirOrden(o.orden_id)} style={estilos.tareaCard}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{o.proveedor_nombre}</div>
                <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                  Pedido el {new Date(o.fecha_pedido).toLocaleDateString('es-PE')} · {o.lineas_totales - o.lineas_pendientes}/
                  {o.lineas_totales} recibido
                </div>
              </div>
              <span style={{ ...estilos.badge, background: o.estado === 'recibida_parcial' ? '#D9A441' : '#7A6F63' }}>
                Falta{o.lineas_pendientes === 1 ? '' : 'n'} {o.lineas_pendientes}
              </span>
            </button>
          ))}
      </div>
    </main>
  );
}

// ============================================================
// RECIBIR ORDEN — escanear o tocar cada producto que llegó,
// confirmar cantidad y precio. Se puede recibir de a poco (parcial).
// ============================================================

function RecibirOrden({ usuario, ordenId, onVolver, onCerrarSesion }) {
  const [estado, setEstado] = useState('cargando'); // cargando | lista | completada | error
  const [mensajeError, setMensajeError] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [recibidas, setRecibidas] = useState([]); // { nombre, comparacion, precioAnterior, precioNuevo }
  const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
  const [cantidadRecibida, setCantidadRecibida] = useState('');
  const [precioRecibido, setPrecioRecibido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mensajeEscaner, setMensajeEscaner] = useState('');

  async function cargarPendientes() {
    const { data, error } = await supabase
      .from('vw_lineas_pendientes')
      .select('detalle_id, producto_id, nombre, unidad_inventario, codigo_barras, precio_bruto_actual, cantidad_pedida')
      .eq('orden_compra_id', ordenId);

    if (error) {
      setMensajeError(error.message);
      setEstado('error');
      return;
    }

    setPendientes(data || []);
    setEstado(data.length === 0 ? 'completada' : 'lista');
  }

  useEffect(() => {
    if (!supabase || !ordenId) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }
    cargarPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenId]);

  function elegirLinea(l) {
    setLineaSeleccionada(l);
    setCantidadRecibida(String(l.cantidad_pedida));
    setPrecioRecibido(l.precio_bruto_actual != null ? String(l.precio_bruto_actual) : '');
    setEscaneando(false);
  }

  async function confirmarLinea() {
    const cantidadNum = Number(cantidadRecibida);
    const precioNum = Number(precioRecibido);
    if (!cantidadNum || cantidadNum <= 0 || Number.isNaN(precioNum) || precioNum < 0) return;

    setGuardando(true);
    const { data, error } = await supabase.rpc('recibir_linea_orden', {
      p_detalle_id: lineaSeleccionada.detalle_id,
      p_cantidad_recibida: cantidadNum,
      p_precio_unitario: precioNum,
      p_usuario_id: usuario?.id || null,
    });
    setGuardando(false);

    if (error || !data || data.length === 0) {
      setMensajeError(error ? error.message : 'No se pudo registrar la recepción.');
      setEstado('error');
      return;
    }

    setRecibidas((prev) => [
      ...prev,
      {
        nombre: lineaSeleccionada.nombre,
        comparacion: data[0].comparacion,
        precioAnterior: data[0].precio_anterior,
        precioNuevo: precioNum,
      },
    ]);
    setLineaSeleccionada(null);
    await cargarPendientes();
  }

  function alEscanear(codigo) {
    const encontrada = pendientes.find((l) => l.codigo_barras === codigo);
    if (!encontrada) {
      setMensajeEscaner('Ese código no corresponde a ningún producto pendiente de esta orden.');
      return;
    }
    setMensajeEscaner('');
    elegirLinea(encontrada);
  }

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Recibir orden</h1>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>Algo no funcionó.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'completada' && (
          <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginBottom: 12 }}>
            <strong>Esta orden ya está completa.</strong>
            <p style={{ marginBottom: 0 }}>Todos los productos pedidos ya fueron recibidos.</p>
          </div>
        )}

        {estado === 'lista' && !lineaSeleccionada && (
          <>
            {escaneando ? (
              <EscanerCodigo
                onDetectado={(codigo) => {
                  setEscaneando(false);
                  alEscanear(codigo);
                }}
                onCancelar={() => setEscaneando(false)}
              />
            ) : (
              <button
                onClick={() => {
                  setMensajeEscaner('');
                  setEscaneando(true);
                }}
                style={{ ...estilos.boton, marginBottom: 16 }}
              >
                Escanear código de barras
              </button>
            )}

            {mensajeEscaner && <p style={{ color: '#C1592B', fontSize: 14 }}>{mensajeEscaner}</p>}

            <p style={{ color: '#7A6F63', textAlign: 'left', fontSize: 13 }}>O toca un producto de la lista:</p>

            {pendientes.map((l) => (
              <button key={l.detalle_id} onClick={() => elegirLinea(l)} style={estilos.opcionCard}>
                {l.nombre} — se pidieron {formatoNumero(l.cantidad_pedida)}{' '}
                {ETIQUETA_UNIDAD[l.unidad_inventario] || l.unidad_inventario}
                {!l.codigo_barras && ' (sin código de barras)'}
              </button>
            ))}
          </>
        )}

        {lineaSeleccionada && (
          <>
            <p style={{ color: '#7A6F63', marginTop: 0, textAlign: 'left' }}>{lineaSeleccionada.nombre}</p>

            <label style={estilos.etiquetaCampo}>
              Cantidad que llegó ({ETIQUETA_UNIDAD[lineaSeleccionada.unidad_inventario] || lineaSeleccionada.unidad_inventario}) — se
              pidieron {formatoNumero(lineaSeleccionada.cantidad_pedida)}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={cantidadRecibida}
              onChange={(e) => setCantidadRecibida(e.target.value)}
              style={estilos.input}
            />

            <label style={estilos.etiquetaCampo}>Precio pagado</label>
            <input
              type="number"
              inputMode="decimal"
              value={precioRecibido}
              onChange={(e) => setPrecioRecibido(e.target.value)}
              style={estilos.input}
            />

            <button
              onClick={confirmarLinea}
              disabled={guardando || !cantidadRecibida || Number(cantidadRecibida) <= 0 || precioRecibido === ''}
              style={{
                ...estilos.boton,
                opacity: guardando || !cantidadRecibida || Number(cantidadRecibida) <= 0 || precioRecibido === '' ? 0.5 : 1,
              }}
            >
              {guardando ? 'Guardando...' : 'Confirmar'}
            </button>
            <button onClick={() => setLineaSeleccionada(null)} style={{ ...estilos.enlace, marginTop: 12 }}>
              Cancelar
            </button>
          </>
        )}

        {recibidas.length > 0 && (
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: '#7A6F63', fontWeight: 600 }}>Ya recibidos en esta visita:</p>
            {recibidas.map((r, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 14 }}>{r.nombre}</div>
                <MensajePrecio comparacion={r.comparacion} precioAnterior={r.precioAnterior} precioNuevo={r.precioNuevo} />
              </div>
            ))}
          </div>
        )}

        {estado === 'completada' && (
          <button onClick={onVolver} style={{ ...estilos.boton, marginTop: 8 }}>
            Volver a órdenes
          </button>
        )}
      </div>
    </main>
  );
}

// ============================================================
// ESCÁNER DE CÓDIGO DE BARRAS — usa la cámara del celular/tablet.
// Es la parte más nueva y menos probada de todo esto: si la cámara
// falla por lo que sea, siempre se puede tocar el producto de la
// lista en vez de escanear.
// ============================================================

function EscanerCodigo({ onDetectado, onCancelar }) {
  const [estadoCamara, setEstadoCamara] = useState('iniciando'); // iniciando | activa | error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let scanner = null;
    let detenido = false;

    async function iniciar() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (detenido) return;

        scanner = new Html5Qrcode('lector-codigo-barras');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (textoDecodificado) => {
            if (detenido) return;
            detenido = true;
            scanner
              .stop()
              .catch(() => {})
              .finally(() => onDetectado(textoDecodificado));
          },
          () => {
            // no se detectó nada en este cuadro de video; es normal, se ignora
          }
        );

        if (!detenido) setEstadoCamara('activa');
      } catch (err) {
        setEstadoCamara('error');
        setMensaje(
          'No se pudo abrir la cámara (puede faltar dar el permiso, o el navegador no lo soporta). Toca el producto de la lista en su lugar.'
        );
      }
    }

    iniciar();

    return () => {
      detenido = true;
      if (scanner) scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        id="lector-codigo-barras"
        style={{ width: '100%', borderRadius: 10, overflow: 'hidden', background: '#000', minHeight: estadoCamara === 'activa' ? undefined : 120 }}
      />
      {estadoCamara === 'iniciando' && <p style={{ fontSize: 13, color: '#7A6F63' }}>Abriendo cámara...</p>}
      {estadoCamara === 'error' && <p style={{ fontSize: 13, color: '#C1592B' }}>{mensaje}</p>}
      <button onClick={onCancelar} style={{ ...estilos.enlace, marginTop: 8 }}>
        Cancelar
      </button>
    </div>
  );
}

// ============================================================
// HACER PEDIDO — un trabajador pide materiales al almacén.
// ============================================================

function HacerPedido({ usuario, onVolver, onCerrarSesion }) {
  const [paso, setPaso] = useState('cargando'); // cargando | form | guardando | exito | error
  const [mensajeError, setMensajeError] = useState('');
  const [productos, setProductos] = useState([]);

  const [prioridad, setPrioridad] = useState('normal');
  const [lineas, setLineas] = useState([]); // { producto_id, nombre, unidad, cantidad }

  const [busqueda, setBusqueda] = useState('');
  const [productoParaAgregar, setProductoParaAgregar] = useState(null);
  const [cantidadParaAgregar, setCantidadParaAgregar] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setPaso('error');
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, unidad_inventario')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        setMensajeError(error.message);
        setPaso('error');
        return;
      }

      setProductos(data || []);
      setPaso('form');
    }

    cargar();
  }, []);

  const resultadosBusqueda =
    busqueda.trim().length === 0
      ? []
      : productos
          .filter((p) => p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
          .filter((p) => !lineas.some((l) => l.producto_id === p.id))
          .slice(0, 8);

  function confirmarLinea() {
    const cantidadNum = Number(cantidadParaAgregar);
    if (!cantidadNum || cantidadNum <= 0) return;
    setLineas([
      ...lineas,
      {
        producto_id: productoParaAgregar.id,
        nombre: productoParaAgregar.nombre,
        unidad: productoParaAgregar.unidad_inventario,
        cantidad: cantidadNum,
      },
    ]);
    setProductoParaAgregar(null);
    setCantidadParaAgregar('');
    setBusqueda('');
  }

  function quitarLinea(producto_id) {
    setLineas(lineas.filter((l) => l.producto_id !== producto_id));
  }

  async function enviarPedido() {
    if (lineas.length === 0) return;
    setPaso('guardando');

    const { error } = await supabase.rpc('crear_pedido', {
      p_solicitante_id: usuario.id,
      p_prioridad: prioridad,
      p_lineas: lineas.map((l) => ({ producto_id: l.producto_id, cantidad: l.cantidad })),
    });

    if (error) {
      setMensajeError(error.message);
      setPaso('error');
      return;
    }

    setPaso('exito');
  }

  function empezarOtro() {
    setPrioridad('normal');
    setLineas([]);
    setBusqueda('');
    setProductoParaAgregar(null);
    setPaso('form');
  }

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Hacer pedido</h1>

        {paso === 'cargando' && <p>Cargando...</p>}

        {paso === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>Algo no funcionó.</strong>
            <p style={{ marginBottom: 8 }}>{mensajeError}</p>
            <button onClick={() => setPaso('form')} style={estilos.enlace}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {(paso === 'form' || paso === 'guardando') && (
          <>
            <label style={estilos.etiquetaCampo}>¿Qué tan urgente es?</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setPrioridad('normal')}
                style={{
                  ...estilos.opcionCard,
                  flex: 1,
                  marginBottom: 0,
                  textAlign: 'center',
                  background: prioridad === 'normal' ? '#F1EAE0' : '#fff',
                  fontWeight: prioridad === 'normal' ? 600 : 400,
                }}
              >
                Normal
              </button>
              <button
                onClick={() => setPrioridad('urgente')}
                style={{
                  ...estilos.opcionCard,
                  flex: 1,
                  marginBottom: 0,
                  textAlign: 'center',
                  background: prioridad === 'urgente' ? '#FDF3E3' : '#fff',
                  color: prioridad === 'urgente' ? '#7A5A16' : '#2B2320',
                  fontWeight: prioridad === 'urgente' ? 600 : 400,
                }}
              >
                Urgente
              </button>
            </div>

            <label style={estilos.etiquetaCampo}>Productos pedidos</label>

            {lineas.map((l) => (
              <div
                key={l.producto_id}
                style={{ ...estilos.opcionCard, cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {l.nombre} — {formatoNumero(l.cantidad)} {ETIQUETA_UNIDAD[l.unidad] || l.unidad}
                </span>
                <button onClick={() => quitarLinea(l.producto_id)} style={{ ...estilos.enlace, fontSize: 18 }}>
                  ×
                </button>
              </div>
            ))}

            {productoParaAgregar ? (
              <div style={{ ...estilos.opcionCard, cursor: 'default' }}>
                <div style={{ marginBottom: 8 }}>{productoParaAgregar.nombre}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={cantidadParaAgregar}
                    onChange={(e) => setCantidadParaAgregar(e.target.value)}
                    placeholder={`Cantidad (${ETIQUETA_UNIDAD[productoParaAgregar.unidad_inventario] || productoParaAgregar.unidad_inventario})`}
                    style={{ ...estilos.input, marginBottom: 0 }}
                  />
                  <button
                    onClick={confirmarLinea}
                    disabled={!cantidadParaAgregar || Number(cantidadParaAgregar) <= 0}
                    style={{ ...estilos.boton, width: 'auto', padding: '0 16px' }}
                  >
                    Agregar
                  </button>
                </div>
                <button onClick={() => setProductoParaAgregar(null)} style={{ ...estilos.enlace, marginTop: 8 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Busca un producto para agregar..."
                  style={estilos.input}
                />
                {resultadosBusqueda.map((p) => (
                  <button key={p.id} onClick={() => setProductoParaAgregar(p)} style={estilos.opcionCard}>
                    {p.nombre}
                  </button>
                ))}
              </>
            )}

            <button
              onClick={enviarPedido}
              disabled={paso === 'guardando' || lineas.length === 0}
              style={{ ...estilos.boton, marginTop: 16, opacity: paso === 'guardando' || lineas.length === 0 ? 0.5 : 1 }}
            >
              {paso === 'guardando' ? 'Enviando...' : `Enviar pedido (${lineas.length} producto${lineas.length === 1 ? '' : 's'})`}
            </button>
          </>
        )}

        {paso === 'exito' && (
          <>
            <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginBottom: 12, textAlign: 'left' }}>
              <strong>Pedido enviado.</strong>
              <p style={{ marginBottom: 0 }}>Lo vas a poder seguir desde "Mis pedidos" en Inicio.</p>
            </div>
            <button onClick={empezarOtro} style={estilos.boton}>
              Hacer otro pedido
            </button>
            <button onClick={onVolver} style={{ ...estilos.enlace, marginTop: 14 }}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ============================================================
// MIS PEDIDOS — historial de lo que ha pedido este usuario.
// ============================================================

const ETIQUETA_ESTADO_PEDIDO = {
  enviado: { texto: 'Enviado', color: '#7A6F63' },
  visto: { texto: 'Visto por almacén', color: '#7A6F63' },
  preparando: { texto: 'Preparando', color: '#D9A441' },
  enviado_almacen: { texto: 'Listo, confirma qué llegó', color: '#3E7A49' },
  recibido_conforme: { texto: 'Recibido conforme', color: '#3E7A49' },
  recibido_con_diferencia: { texto: 'Recibido con diferencia', color: '#C1592B' },
};

function MisPedidos({ usuario, onVolver, onCerrarSesion, onAbrirPedido }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [pedidos, setPedidos] = useState([]);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from('vw_mis_pedidos')
        .select('pedido_id, prioridad, estado, creado_en, cantidad_productos')
        .eq('solicitante_id', usuario.id);

      if (error) {
        setMensajeError(error.message);
        setEstado('error');
        return;
      }

      setPedidos(data || []);
      setEstado('ok');
    }

    cargar();
  }, [usuario.id]);

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Mis pedidos</h1>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>No se pudo cargar.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'ok' && pedidos.length === 0 && (
          <p style={{ color: '#7A6F63' }}>Todavía no has hecho ningún pedido.</p>
        )}

        {estado === 'ok' &&
          pedidos.map((p) => {
            const info = ETIQUETA_ESTADO_PEDIDO[p.estado] || { texto: p.estado, color: '#7A6F63' };
            return (
              <button key={p.pedido_id} onClick={() => onAbrirPedido(p.pedido_id)} style={estilos.tareaCard}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 17 }}>
                    {p.cantidad_productos} producto{p.cantidad_productos === 1 ? '' : 's'}
                    {p.prioridad === 'urgente' && ' · Urgente'}
                  </div>
                  <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                    {new Date(p.creado_en).toLocaleDateString('es-PE')}
                  </div>
                </div>
                <span style={{ ...estilos.badge, background: info.color }}>{info.texto}</span>
              </button>
            );
          })}
      </div>
    </main>
  );
}

// ============================================================
// DETALLE DE PEDIDO — ver las líneas; si ya llegó, confirmar qué
// se recibió de verdad (esto es lo que detecta si almacén dijo
// que entregó más de lo que en realidad llegó).
// ============================================================

function DetallePedido({ pedidoId, onVolver, onCerrarSesion }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | guardando | confirmado | error
  const [mensajeError, setMensajeError] = useState('');
  const [pedido, setPedido] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [cantidades, setCantidades] = useState({}); // detalle_id -> string
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (!supabase || !pedidoId) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }

    async function cargar() {
      const [rPedido, rLineas] = await Promise.all([
        supabase.from('pedidos').select('id, estado, prioridad, comentario_recepcion').eq('id', pedidoId).single(),
        supabase
          .from('vw_detalle_pedido')
          .select('detalle_id, nombre, unidad_inventario, cantidad_solicitada, cantidad_entregada, cantidad_recibida, diferencia')
          .eq('pedido_id', pedidoId),
      ]);

      if (rPedido.error || rLineas.error) {
        setMensajeError((rPedido.error || rLineas.error).message);
        setEstado('error');
        return;
      }

      setPedido(rPedido.data);
      setLineas(rLineas.data || []);
      const iniciales = {};
      (rLineas.data || []).forEach((l) => {
        iniciales[l.detalle_id] = l.cantidad_entregada != null ? String(l.cantidad_entregada) : '';
      });
      setCantidades(iniciales);
      setEstado('ok');
    }

    cargar();
  }, [pedidoId]);

  async function confirmar() {
    setEstado('guardando');

    const { data, error } = await supabase.rpc('confirmar_recepcion_pedido', {
      p_pedido_id: pedidoId,
      p_lineas: lineas.map((l) => ({ detalle_id: l.detalle_id, cantidad_recibida: Number(cantidades[l.detalle_id]) || 0 })),
      p_comentario: comentario || null,
    });

    if (error) {
      setMensajeError(error.message);
      setEstado('error');
      return;
    }

    setPedido((prev) => ({ ...prev, estado: data }));
    setEstado('confirmado');
  }

  const puedeConfirmar = pedido && pedido.estado === 'enviado_almacen';
  const info = pedido ? ETIQUETA_ESTADO_PEDIDO[pedido.estado] || { texto: pedido.estado, color: '#7A6F63' } : null;

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Pedido</h1>

        {(estado === 'cargando') && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>Algo no funcionó.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {pedido && info && (
          <div style={{ ...estilos.badge, background: info.color, display: 'inline-block', marginBottom: 12 }}>{info.texto}</div>
        )}

        {(estado === 'ok' || estado === 'guardando') &&
          lineas.map((l) => (
            <div key={l.detalle_id} style={{ ...estilos.opcionCard, cursor: 'default' }}>
              <div style={{ fontWeight: 600 }}>{l.nombre}</div>
              <div style={{ fontSize: 13, color: '#7A6F63', marginBottom: puedeConfirmar ? 8 : 0 }}>
                Pediste {formatoNumero(l.cantidad_solicitada)} {ETIQUETA_UNIDAD[l.unidad_inventario] || l.unidad_inventario}
                {l.cantidad_entregada != null && ` · Almacén dice que entregó ${formatoNumero(l.cantidad_entregada)}`}
                {l.cantidad_recibida != null && ` · Confirmaste que llegó ${formatoNumero(l.cantidad_recibida)}`}
              </div>
              {puedeConfirmar && (
                <div>
                  <label style={estilos.etiquetaCampo}>¿Cuánto te llegó de verdad?</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cantidades[l.detalle_id] ?? ''}
                    onChange={(e) => setCantidades({ ...cantidades, [l.detalle_id]: e.target.value })}
                    style={{ ...estilos.input, marginBottom: 0 }}
                  />
                </div>
              )}
            </div>
          ))}

        {puedeConfirmar && (
          <>
            <label style={estilos.etiquetaCampo}>Comentario (opcional)</label>
            <input
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej: llegaron menos cajas de las que dijeron"
              style={estilos.input}
            />
            <button onClick={confirmar} disabled={estado === 'guardando'} style={{ ...estilos.boton, opacity: estado === 'guardando' ? 0.5 : 1 }}>
              {estado === 'guardando' ? 'Guardando...' : 'Confirmar recepción'}
            </button>
          </>
        )}

        {estado === 'confirmado' && (
          <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginTop: 12 }}>
            Recepción confirmada.
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// PEDIDOS POR ATENDER — lo que los trabajadores han pedido.
// ============================================================

function PedidosPorAtender({ onVolver, onCerrarSesion, onAbrirPedido }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [pedidos, setPedidos] = useState([]);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }

    async function cargar() {
      const { data, error } = await supabase
        .from('vw_pedidos_por_atender')
        .select('pedido_id, prioridad, estado, creado_en, solicitante_nombre, cantidad_productos');

      if (error) {
        setMensajeError(error.message);
        setEstado('error');
        return;
      }

      setPedidos(data || []);
      setEstado('ok');
    }

    cargar();
  }, []);

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Pedidos por atender</h1>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>No se pudo cargar.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'ok' && pedidos.length === 0 && (
          <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C' }}>
            No hay pedidos pendientes de atender.
          </div>
        )}

        {estado === 'ok' &&
          pedidos.map((p) => (
            <button key={p.pedido_id} onClick={() => onAbrirPedido(p.pedido_id)} style={estilos.tareaCard}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>
                  {p.solicitante_nombre}
                  {p.prioridad === 'urgente' && ' · Urgente'}
                </div>
                <div style={{ fontSize: 13, color: '#7A6F63', marginTop: 2 }}>
                  {p.cantidad_productos} producto{p.cantidad_productos === 1 ? '' : 's'} ·{' '}
                  {new Date(p.creado_en).toLocaleDateString('es-PE')}
                </div>
              </div>
              {p.prioridad === 'urgente' && <span style={{ ...estilos.badge, background: '#C1592B' }}>Urgente</span>}
            </button>
          ))}
      </div>
    </main>
  );
}

// ============================================================
// ATENDER PEDIDO — almacén marca cuánto le entrega a cada quien.
// ============================================================

function AtenderPedido({ pedidoId, onVolver, onCerrarSesion }) {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | guardando | listo | error
  const [mensajeError, setMensajeError] = useState('');
  const [lineas, setLineas] = useState([]);
  const [cantidades, setCantidades] = useState({}); // detalle_id -> string

  useEffect(() => {
    if (!supabase || !pedidoId) {
      setMensajeError('Falta configurar la conexión con la base de datos.');
      setEstado('error');
      return;
    }

    async function cargar() {
      await supabase.rpc('marcar_pedido_visto', { p_pedido_id: pedidoId });

      const { data, error } = await supabase
        .from('vw_detalle_pedido')
        .select('detalle_id, nombre, unidad_inventario, cantidad_solicitada')
        .eq('pedido_id', pedidoId);

      if (error) {
        setMensajeError(error.message);
        setEstado('error');
        return;
      }

      setLineas(data || []);
      const iniciales = {};
      (data || []).forEach((l) => {
        iniciales[l.detalle_id] = String(l.cantidad_solicitada);
      });
      setCantidades(iniciales);
      setEstado('ok');
    }

    cargar();
  }, [pedidoId]);

  async function confirmarEntrega() {
    setEstado('guardando');

    const { error } = await supabase.rpc('entregar_pedido', {
      p_pedido_id: pedidoId,
      p_lineas: lineas.map((l) => ({ detalle_id: l.detalle_id, cantidad_entregada: Number(cantidades[l.detalle_id]) || 0 })),
    });

    if (error) {
      setMensajeError(error.message);
      setEstado('error');
      return;
    }

    setEstado('listo');
  }

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
        <h1 style={{ ...estilos.titulo, textAlign: 'left' }}>Atender pedido</h1>

        {estado === 'cargando' && <p>Cargando...</p>}

        {estado === 'error' && (
          <div style={{ background: '#FDECEA', padding: 16, borderRadius: 8, color: '#7A2E22' }}>
            <strong>Algo no funcionó.</strong>
            <p style={{ marginBottom: 0 }}>{mensajeError}</p>
          </div>
        )}

        {estado === 'listo' && (
          <div style={{ background: '#EAF6EC', padding: 16, borderRadius: 8, color: '#1E5C2C', marginBottom: 12 }}>
            <strong>Pedido marcado como entregado.</strong>
            <p style={{ marginBottom: 0 }}>La persona que lo pidió ahora puede confirmar qué le llegó.</p>
          </div>
        )}

        {(estado === 'ok' || estado === 'guardando') && (
          <>
            <p style={{ color: '#7A6F63', marginTop: 0, textAlign: 'left', fontSize: 13 }}>
              Cuánto le vas a entregar de cada producto (por defecto, lo que pidió):
            </p>
            {lineas.map((l) => (
              <div key={l.detalle_id} style={{ ...estilos.opcionCard, cursor: 'default' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {l.nombre} — pidió {formatoNumero(l.cantidad_solicitada)} {ETIQUETA_UNIDAD[l.unidad_inventario] || l.unidad_inventario}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={cantidades[l.detalle_id] ?? ''}
                  onChange={(e) => setCantidades({ ...cantidades, [l.detalle_id]: e.target.value })}
                  style={{ ...estilos.input, marginBottom: 0 }}
                />
              </div>
            ))}

            <button
              onClick={confirmarEntrega}
              disabled={estado === 'guardando'}
              style={{ ...estilos.boton, marginTop: 12, opacity: estado === 'guardando' ? 0.5 : 1 }}
            >
              {estado === 'guardando' ? 'Guardando...' : 'Marcar como entregado'}
            </button>
          </>
        )}

        {estado === 'listo' && (
          <button onClick={onVolver} style={{ ...estilos.boton }}>
            Volver a pedidos
          </button>
        )}
      </div>
    </main>
  );
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
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    fontSize: 16,
    borderRadius: 10,
    border: '1px solid #E7DDD3',
    background: '#fff',
    color: '#2B2320',
    marginBottom: 12,
  },
  etiquetaCampo: { display: 'block', textAlign: 'left', fontSize: 13, color: '#7A6F63', marginBottom: 4 },
  opcionCard: {
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    marginBottom: 8,
    borderRadius: 10,
    border: '1px solid #E7DDD3',
    background: '#fff',
    color: '#2B2320',
    fontSize: 15,
    cursor: 'pointer',
  },
};
