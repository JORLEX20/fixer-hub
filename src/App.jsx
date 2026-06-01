import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from './supabase'

// ==========================================
// PANTALLA 1: DIRECTORIO PÚBLICO (MARKETPLACE)
// ==========================================
function DirectorioFixers() {
  const [empresas, setEmpresas] = useState([])
  const [filtroCat, setFiltroCat] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')

  const categorias = ['Todas', 'Ropa y Moda', 'Comida y Restaurantes', 'Tecnología', 'Servicios', 'Otros']

  useEffect(() => {
    const cargarEmpresas = async () => {
      const { data } = await supabase.from('perfiles_empresa').select('*').order('nombre_empresa', { ascending: true })
      if (data) setEmpresas(data)
    }
    cargarEmpresas()
  }, [])

  const empresasFiltradas = empresas.filter(emp => {
    const coincideCategoria = filtroCat === 'Todas' || (emp.categoria || 'Otros') === filtroCat
    const coincideTexto = emp.nombre_empresa?.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideTexto
  })

  const hideScrollbarCSS = `
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `

  return (
    <div className="min-h-screen bg-linear-to-tr from-slate-950 via-slate-900 to-black p-4 sm:p-8 font-sans text-slate-200">
      <style>{hideScrollbarCSS}</style>
      <div className="mx-auto max-w-6xl">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
              FIXER_HUB // DIRECTORIO
            </h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Encuentra los mejores comercios locales</p>
          </div>
          <Link to="/login" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all">
            🛠️ Acceso para Comercios
          </Link>
        </div>

        <div className="mb-8 space-y-4">
          <input 
            type="text" 
            placeholder="🔍 Buscar comercio por nombre..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-md bg-slate-900/80 border border-slate-700 p-4 rounded-2xl text-white focus:outline-none focus:border-cyan-500 transition-all shadow-lg backdrop-blur-sm"
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categorias.map(cat => (
              <button 
                key={cat} 
                onClick={() => setFiltroCat(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filtroCat === cat ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {empresasFiltradas.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 font-bold uppercase tracking-widest">No se encontraron comercios en esta categoría.</div>
          ) : (
            empresasFiltradas.map(emp => (
              <Link key={emp.id} to={`/tienda/${emp.id}`} className="group relative bg-slate-900/40 rounded-3xl p-6 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all backdrop-blur-sm flex flex-col items-center text-center shadow-xl hover:-translate-y-1">
                <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-slate-950 px-2 py-1 rounded text-cyan-400 border border-slate-800">
                  {emp.categoria || 'Otros'}
                </div>
                {emp.logo_url ? (
                  <img src={emp.logo_url} alt="Logo" className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 group-hover:border-cyan-500 transition-all shadow-lg mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center text-xs text-slate-600 border-4 border-slate-800 group-hover:border-cyan-500 transition-all mb-4">Sin Logo</div>
                )}
                <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{emp.nombre_empresa}</h3>
                <p className="text-xs text-slate-500 mt-2">{emp.contacto}</p>
                <div className="mt-6 w-full bg-cyan-950/30 text-cyan-400 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-cyan-900/50 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                  Visitar Tienda
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// PANTALLA 2: LOGIN Y REGISTRO
// ==========================================
function LoginScreen() {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', nombreEmpresa: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/panel')
    })
  }, [navigate])

  const manejarAcceso = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegistering) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
        })
        if (authError) throw authError

        if (authData.user) {
          const { error: dbError } = await supabase.from('perfiles_empresa').insert([
            { id: authData.user.id, nombre_empresa: formData.nombreEmpresa, contacto: formData.email, categoria: 'Otros' }
          ])
          if (dbError) throw dbError
          navigate('/panel')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email, password: formData.password,
        })
        if (error) throw error
        navigate('/panel')
      }
    } catch (error) {
      alert("Falla en el enlace: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-tr from-slate-900 via-slate-950 to-black p-4 font-sans">
      <div className="absolute top-8 left-8">
        <Link to="/" className="text-slate-500 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest">
          ← Volver al Directorio
        </Link>
      </div>
      <div className="w-full max-w-md relative">
        <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-red-600 to-yellow-600 opacity-20 blur-xl"></div>
        <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-r from-red-500 to-yellow-500">
              FIXER_HUB // OS
            </h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">Terminal de Acceso Corporativo</p>
          </div>
          <form onSubmit={manejarAcceso} className="space-y-5">
            {isRegistering && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Nombre del Emprendimiento</label>
                <input type="text" value={formData.nombreEmpresa} onChange={(e) => setFormData({...formData, nombreEmpresa: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 focus:border-red-500 focus:outline-none" required={isRegistering} />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">ID de Red (Correo)</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 focus:border-red-500 focus:outline-none" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Código de Acceso</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 focus:border-red-500 focus:outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="mt-4 w-full rounded-lg bg-linear-to-r from-red-600 to-yellow-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-black hover:scale-[1.02] active:scale-95 disabled:opacity-50">
              {loading ? 'Procesando...' : (isRegistering ? 'Establecer Enlace' : 'Iniciar Conexión')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-semibold text-slate-400 hover:text-yellow-500">
              {isRegistering ? '¿Ya tienes un alijo? Accede aquí.' : '¿Nuevo Fixer? Registra tu emprendimiento.'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// PANTALLA 3: PANEL DE CONTROL SEGURO
// ==========================================
function FixerDashboard() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [vistaActual, setVistaActual] = useState('inventario')
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [subiendoImg, setSubiendoImg] = useState(false)

  const [isModalProdOpen, setIsModalProdOpen] = useState(false)
  const [modoEdicionId, setModoEdicionId] = useState(null)
  
  const [formProducto, setFormProducto] = useState({ 
    nombre: '', descripcion: '', precio: '', 
    variantes: [{ nombre: 'Estándar', stock: 0 }],
    galeria_urls: [] 
  })

  const [isModalPedidoOpen, setIsModalPedidoOpen] = useState(false)
  const [formPedido, setFormPedido] = useState({ cliente: '', redSocial: 'Instagram', productoId: '', talla: '', cantidad: 1 })

  const verificarSesionYDatos = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }
    setUsuario(session.user)

    const { data: perfil } = await supabase.from('perfiles_empresa').select('*').eq('id', session.user.id).single()
    if (perfil) setEmpresa(perfil)

    const { data: prods } = await supabase.from('productos').select('*').eq('empresa_id', session.user.id).order('id', { ascending: true })
    if (prods) setProductos(prods)

    const { data: peds } = await supabase.from('pedidos').select('*').eq('empresa_id', session.user.id).order('id', { ascending: false })
    if (peds) setPedidos(peds)
  }, [navigate])

  useEffect(() => {
    // eslint-disable-next-line
    verificarSesionYDatos()
  }, [verificarSesionYDatos])

  const subirImagenCloud = async (file, folder) => {
    if (!file) return null
    const fileExt = file.name.split('.').pop()
    const fileName = `${usuario.id}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('imagenes-tienda').upload(fileName, file)
    if (uploadError) {
      console.error("Error al subir archivo:", uploadError.message)
      return null
    }
    const { data } = supabase.storage.from('imagenes-tienda').getPublicUrl(fileName)
    return data.publicUrl
  }

  const manejarFotoPerfil = async (e) => {
    const file = e.target.files[0]
    setSubiendoImg(true)
    const url = await subirImagenCloud(file, 'perfil')
    if (url) {
      await supabase.from('perfiles_empresa').update({ logo_url: url }).eq('id', usuario.id)
      await verificarSesionYDatos()
    }
    setSubiendoImg(false)
  }

  const manejarCambioCategoria = async (e) => {
    const nuevaCategoria = e.target.value;
    await supabase.from('perfiles_empresa').update({ categoria: nuevaCategoria }).eq('id', usuario.id)
    await verificarSesionYDatos()
  }

  const manejarFotosProducto = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    setSubiendoImg(true)
    const nuevasUrls = []
    
    for (let file of files) {
      const url = await subirImagenCloud(file, 'productos')
      if (url) nuevasUrls.push(url)
    }
    
    setFormProducto(prev => ({ ...prev, galeria_urls: [...(prev.galeria_urls || []), ...nuevasUrls] }))
    setSubiendoImg(false)
  }

  const borrarFotoProducto = (index) => {
    const nuevas = formProducto.galeria_urls.filter((_, i) => i !== index)
    setFormProducto({...formProducto, galeria_urls: nuevas})
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const cerrarModalProducto = () => {
    setFormProducto({ nombre: '', descripcion: '', precio: '', variantes: [{ nombre: 'Estándar', stock: 0 }], galeria_urls: [] })
    setModoEdicionId(null)
    setIsModalProdOpen(false)
  }

  const agregarVariante = () => {
    setFormProducto({...formProducto, variantes: [...formProducto.variantes, { nombre: '', stock: 0 }]})
  }

  const actualizarVariante = (index, campo, valor) => {
    const nuevasVariantes = [...formProducto.variantes]
    nuevasVariantes[index][campo] = valor
    setFormProducto({...formProducto, variantes: nuevasVariantes})
  }

  const borrarVariante = (index) => {
    if (formProducto.variantes.length === 1) return alert("Debe existir al menos una variante (puedes llamarla 'Estándar').")
    const nuevasVariantes = formProducto.variantes.filter((_, i) => i !== index)
    setFormProducto({...formProducto, variantes: nuevasVariantes})
  }

  const guardarProducto = async () => {
    if (formProducto.nombre.trim() === '') return
    
    const stockTallasObj = {}
    formProducto.variantes.forEach(v => {
      const nombreVar = v.nombre.trim() || 'Estándar'
      stockTallasObj[nombreVar] = (stockTallasObj[nombreVar] || 0) + (parseInt(v.stock) || 0)
    })

    const datosProducto = {
      empresa_id: usuario.id,
      nombre: formProducto.nombre,
      descripcion: formProducto.descripcion,
      precio: parseFloat(formProducto.precio) || 0,
      stock_tallas: stockTallasObj, 
      galeria_urls: formProducto.galeria_urls
    }

    if (modoEdicionId !== null) {
      await supabase.from('productos').update(datosProducto).eq('id', modoEdicionId)
    } else {
      await supabase.from('productos').insert([datosProducto])
    }
    verificarSesionYDatos() 
    cerrarModalProducto()
  }

  const borrarProducto = async (id) => {
    if (window.confirm("¿Eliminar este producto permanentemente?")) {
      await supabase.from('productos').delete().eq('id', id)
      verificarSesionYDatos()
    }
  }

  const prepararEdicion = (producto) => {
    setModoEdicionId(producto.id)
    const tallasDb = producto.stock_tallas || { 'Estándar': producto.stock || 0 }
    
    const variantesArray = Object.entries(tallasDb).map(([nombre, stock]) => ({ nombre, stock }))
    if (variantesArray.length === 0) variantesArray.push({ nombre: 'Estándar', stock: 0 })

    const galeria = producto.galeria_urls && producto.galeria_urls.length > 0 ? producto.galeria_urls : (producto.imagen_url ? [producto.imagen_url] : [])
    
    setFormProducto({ 
      nombre: producto.nombre, 
      descripcion: producto.descripcion, 
      precio: producto.precio, 
      variantes: variantesArray, 
      galeria_urls: galeria 
    })
    setIsModalProdOpen(true)
  }

  const calcularStockTotal = (stockObj) => {
    if (!stockObj) return 0;
    return Object.values(stockObj).reduce((acc, val) => acc + (parseInt(val) || 0), 0)
  }

  const guardarPedidoRapido = async () => {
    const prodSeleccionado = productos.find(p => p.id === parseInt(formPedido.productoId))
    if (!formPedido.cliente.trim() || !prodSeleccionado || !formPedido.talla) return alert("Faltan datos o variante.")
    
    const cant = parseInt(formPedido.cantidad) || 1
    const tallasActuales = prodSeleccionado.stock_tallas || {}
    const stockDeTalla = tallasActuales[formPedido.talla] || 0

    if (stockDeTalla < cant) return alert(`Stock insuficiente en la opción ${formPedido.talla}.`)

    const nuevoStockTallas = { ...tallasActuales, [formPedido.talla]: stockDeTalla - cant }
    await supabase.from('productos').update({ stock_tallas: nuevoStockTallas }).eq('id', prodSeleccionado.id)

    const nuevoPedido = {
      empresa_id: usuario.id,
      cliente: formPedido.cliente,
      red_social: formPedido.redSocial,
      producto_nombre: `${prodSeleccionado.nombre} | Opción: ${formPedido.talla}`,
      cantidad: cant,
      total: prodSeleccionado.precio * cant,
      estado: 'Pendiente'
    }
    await supabase.from('pedidos').insert([nuevoPedido])
    
    verificarSesionYDatos() 
    setFormPedido({ cliente: '', redSocial: 'Instagram', productoId: '', talla: '', cantidad: 1 })
    setIsModalPedidoOpen(false)
  }

  const cambiarEstadoPedido = async (pedido, nuevoEstado) => {
    if (nuevoEstado === '❌ Cancelado' && pedido.estado !== '❌ Cancelado') {
      const partes = pedido.producto_nombre.split(' | Opción: ')
      const nombreReal = partes[0]
      const talla = partes[1] || 'Estándar'

      const { data: prod } = await supabase.from('productos').select('*').eq('nombre', nombreReal).eq('empresa_id', usuario.id).single()
      if (prod) {
        const tallasActuales = prod.stock_tallas || {}
        const nuevoStockTallas = { ...tallasActuales, [talla]: (tallasActuales[talla] || 0) + pedido.cantidad }
        await supabase.from('productos').update({ stock_tallas: nuevoStockTallas }).eq('id', prod.id)
      }
    }
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id)
    verificarSesionYDatos()
  }

  if (!usuario) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando enlace...</div>

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-8 font-sans text-slate-100">
      <nav className="mx-auto mb-8 max-w-5xl rounded-2xl bg-slate-900/60 p-4 shadow-2xl border border-slate-700/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {empresa?.logo_url ? (
              <img src={empresa.logo_url} alt="Logo" className="w-14 h-14 rounded-full object-cover border-2 border-yellow-500 shadow-lg" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 border border-slate-700">No Img</div>
            )}
            <div>
              <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-r from-red-500 to-yellow-500 block leading-tight">
                {empresa ? empresa.nombre_empresa.toUpperCase() : 'FIXER_HUB'}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <label className="text-[10px] text-yellow-500 cursor-pointer hover:underline uppercase tracking-widest">
                  {subiendoImg ? 'Subiendo...' : '⚙️ Logo'}
                  <input type="file" accept="image/*" onChange={manejarFotoPerfil} className="hidden" disabled={subiendoImg} />
                </label>
                <select 
                  value={empresa?.categoria || 'Otros'} 
                  onChange={manejarCambioCategoria}
                  className="bg-slate-950 border border-slate-700 text-[10px] text-slate-400 uppercase tracking-widest rounded px-1 py-0.5 focus:outline-none focus:border-yellow-500"
                >
                  <option value="Ropa y Moda">Ropa y Moda</option>
                  <option value="Comida y Restaurantes">Comida y Restaurantes</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={() => window.open(`/tienda/${usuario.id}`, '_blank')} className="rounded-xl px-3 py-2 text-xs font-bold text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/10 transition-all">🔗 Mi Tienda</button>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tienda/${usuario.id}`); alert('¡Link copiado!'); }} className="rounded-xl px-3 py-2 text-xs font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all mr-2">📋 Copiar Link</button>
            <div className="hidden sm:flex gap-2 border-l border-slate-700 pl-4">
              <button onClick={() => setVistaActual('inventario')} className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${vistaActual === 'inventario' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📦 Inventario</button>
              <button onClick={() => setVistaActual('pedidos')} className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${vistaActual === 'pedidos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>🛒 Pedidos</button>
            </div>
            <button onClick={cerrarSesion} className="text-sm font-bold text-slate-400 hover:text-red-500 border-l border-slate-700 pl-4">Salir</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl rounded-2xl bg-slate-900/40 p-6 sm:p-8 shadow-2xl border border-slate-800 backdrop-blur-xl">
        {/* INVENTARIO */}
        {vistaActual === 'inventario' && (
          <div>
            <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-extrabold text-white">Gestión de Alijo</h1>
              <button onClick={() => setIsModalProdOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30">+ Nuevo Producto</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {productos.length === 0 ? <p className="text-slate-500 p-4">Alijo vacío. Registra nueva mercancía.</p> : productos.map(p => (
                <div key={p.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex gap-4 items-start shadow-md hover:border-indigo-500/30 transition-colors">
                  <div className="w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 relative">
                    {p.galeria_urls && p.galeria_urls.length > 0 ? (
                      <>
                        <img src={p.galeria_urls[0]} alt="Prod" className="w-full h-full object-cover" />
                        {p.galeria_urls.length > 1 && <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1 rounded">+{p.galeria_urls.length - 1} fotos</span>}
                      </>
                    ) : (p.imagen_url ? <img src={p.imagen_url} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-slate-600">Sin foto</div>)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white leading-tight">{p.nombre}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.descripcion}</p>
                    <div className="mt-2 text-indigo-400 font-black">${p.precio}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(p.stock_tallas || {}).filter(entry => entry[1] > 0).map(([talla, cant]) => (
                        <span key={talla} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{talla}: {cant}</span>
                      ))}
                      {calcularStockTotal(p.stock_tallas) === 0 && <span className="text-[10px] bg-red-950/50 text-red-400 px-2 py-0.5 rounded">Agotado</span>}
                    </div>
                  </div>
                  <div className="space-y-2 shrink-0">
                    <button onClick={() => prepararEdicion(p)} className="block w-full text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-indigo-400 font-bold transition-colors">Editar</button>
                    <button onClick={() => borrarProducto(p.id)} className="block w-full text-xs bg-slate-800 hover:bg-red-950/50 px-3 py-1.5 rounded text-red-400 font-bold transition-colors">Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PEDIDOS (DASHBOARD) */}
        {vistaActual === 'pedidos' && (
          <div>
            <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-extrabold text-white">Contratos (Pedidos)</h1>
              <button onClick={() => setIsModalPedidoOpen(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/30">+ Venta Rápida</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 min-w-[250px]">Cliente / Contacto GPS</th>
                    <th className="px-6 py-4">Detalle del Producto</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Estado del Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pedidos.length === 0 ? <tr><td colSpan="4" className="p-6 text-center text-slate-500">No hay contratos activos.</td></tr> : pedidos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-white block leading-snug">{p.cliente}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{p.red_social}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-bold">{p.cantidad}x </span> 
                        <span className="text-slate-300">{p.producto_nombre}</span>
                      </td>
                      <td className="px-6 py-4 text-yellow-500 font-black">${p.total}</td>
                      <td className="px-6 py-4">
                        <select value={p.estado} onChange={(e) => cambiarEstadoPedido(p, e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner">
                          <option value="⏳ Verificando Pago">⏳ Verificando Pago</option>
                          <option value="Pendiente">🟡 Pendiente de Envío / Ejecución</option>
                          <option value="✅ Pagado">✅ Pago Aprobado</option>
                          <option value="🚀 Entregado">🚀 Entregado / Completado</option>
                          <option value="❌ Cancelado">❌ Cancelar y Devolver Stock</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL PRODUCTO DINÁMICO --- */}
      {isModalProdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl my-8">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest border-b border-slate-800 pb-2">{modoEdicionId ? 'Editar' : 'Nuevo'} Producto</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nombre Comercial</label>
                <input type="text" value={formProducto.nombre} onChange={e => setFormProducto({...formProducto, nombre: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Descripción detallada</label>
                <textarea rows="2" value={formProducto.descripcion} onChange={e => setFormProducto({...formProducto, descripcion: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Precio Venta ($)</label>
                <input type="number" value={formProducto.precio} onChange={e => setFormProducto({...formProducto, precio: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500 focus:outline-none" />
              </div>

              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Opciones / Variantes</label>
                  <button onClick={agregarVariante} className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded font-bold">+ Añadir</button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {formProducto.variantes.map((v, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-2 w-full">
                        <input type="text" placeholder="Ej: Rojo, 256GB, S" value={v.nombre} onChange={(e) => actualizarVariante(index, 'nombre', e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white text-xs focus:border-indigo-500 focus:outline-none" />
                      </div>
                      <div className="flex-1 w-full">
                        <input type="number" placeholder="Stock" min="0" value={v.stock} onChange={(e) => actualizarVariante(index, 'stock', e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-center rounded text-white text-xs focus:border-indigo-500 focus:outline-none" />
                      </div>
                      <button onClick={() => borrarVariante(index)} className="w-8 h-8 flex items-center justify-center bg-slate-950 border border-slate-700 hover:bg-red-900/50 hover:border-red-500 hover:text-red-400 text-slate-500 rounded transition-colors text-lg shrink-0">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex justify-between">
                  <span>Galería de Fotos (Slide)</span>
                  {subiendoImg && <span className="text-yellow-500 animate-pulse">Subiendo...</span>}
                </label>
                
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                  {formProducto.galeria_urls.map((url, i) => (
                    <div key={i} className="relative shrink-0 snap-start">
                      <img src={url} className="w-16 h-16 rounded-lg object-cover border border-slate-600" />
                      <button onClick={() => borrarFotoProducto(i)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-xs font-bold hover:bg-red-500">×</button>
                    </div>
                  ))}
                  
                  <label className="w-16 h-16 shrink-0 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-400 transition-colors bg-slate-900/50">
                    <span className="text-xl leading-none">+</span>
                    <span className="text-[9px] font-bold uppercase mt-1">Añadir</span>
                    <input type="file" multiple accept="image/*" onChange={manejarFotosProducto} className="hidden" disabled={subiendoImg} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-slate-800 pt-6">
                <button onClick={cerrarModalProducto} className="text-slate-400 px-4 py-2 hover:bg-slate-800 rounded-lg font-bold uppercase text-xs tracking-widest">Cancelar</button>
                <button onClick={guardarProducto} disabled={subiendoImg} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-indigo-500 disabled:opacity-50">Guardar Alijo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// PANTALLA 4: ESCAPARATE PÚBLICO (CLIENTE)
// ==========================================
function EscaparateCliente() {
  const { empresaId } = useParams()
  const [tienda, setTienda] = useState(null)
  const [catalogo, setCatalogo] = useState([])
  
  // AÑADIDO: 'telefono', 'enlaceGps' y estado para carga de GPS
  const [formCompra, setFormCompra] = useState({ 
    cliente: '', telefono: '', redSocial: 'Instagram', productoId: '', talla: '', cantidad: 1, referencia: '',
    tipoPedido: 'Retiro en Tienda', direccion: '', puntoReferencia: '', enlaceGps: '', fechaReserva: '', horaReserva: '', personas: 1
  })
  const [mensaje, setMensaje] = useState(null)
  const [obteniendoGps, setObteniendoGps] = useState(false)

  useEffect(() => {
    const cargarTienda = async () => {
      const { data: perfil } = await supabase.from('perfiles_empresa').select('nombre_empresa, contacto, logo_url, categoria').eq('id', empresaId).single()
      if (perfil) {
        setTienda(perfil)
        if (perfil.categoria === 'Comida y Restaurantes') {
          setFormCompra(prev => ({ ...prev, tipoPedido: 'Delivery' }))
        }
      }
      
      const { data: prods } = await supabase.from('productos').select('*').eq('empresa_id', empresaId).order('id', { ascending: true })
      const prodsDisponibles = prods?.filter(p => Object.values(p.stock_tallas || {}).some(cant => cant > 0))
      if (prodsDisponibles) setCatalogo(prodsDisponibles)
    }
    cargarTienda()
  }, [empresaId])

  // LÓGICA: CAPTURA DE COORDENADAS VÍA NAVEGADOR
  const obtenerUbicacionGPS = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador o teléfono no soporta la función de GPS.")
      return
    }
    setObteniendoGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const enlace = `https://www.google.com/maps?q=${lat},${lng}`
        setFormCompra(prev => ({ ...prev, enlaceGps: enlace }))
        setObteniendoGps(false)
      },
      (error) => {
        console.error(error)
        alert("No pudimos obtener tu ubicación. Por favor, asegúrate de darle permisos al navegador.")
        setObteniendoGps(false)
      },
      { enableHighAccuracy: true } // Pide la mayor precisión posible al celular
    )
  }

  const procesarCompra = async (e) => {
    e.preventDefault()
    const prodSeleccionado = catalogo.find(p => p.id === parseInt(formCompra.productoId))
    if (!prodSeleccionado || !formCompra.talla) return alert("Selecciona un producto y una opción válida.")
    if (!formCompra.telefono) return alert("El número de teléfono es obligatorio para contactarte.")
    
    const cant = parseInt(formCompra.cantidad) || 1
    const tallasActuales = prodSeleccionado.stock_tallas || {}
    if ((tallasActuales[formCompra.talla] || 0) < cant) return alert("No hay suficiente stock para esa opción.")

    // LÓGICA DE SERIALIZACIÓN (Fusión de datos de Delivery/Reserva y GPS)
    let detallesExtra = '';
    if (formCompra.tipoPedido === 'Delivery') {
      if (!formCompra.direccion && !formCompra.enlaceGps) return alert("Debes ingresar una dirección escrita o capturar tu GPS.");
      const textoGps = formCompra.enlaceGps ? ` [📍 Mapa GPS: ${formCompra.enlaceGps}]` : '';
      detallesExtra = ` | 🛵 Delivery: ${formCompra.direccion} (Ref: ${formCompra.puntoReferencia})${textoGps}`;
    } else if (formCompra.tipoPedido === 'Reservar Mesa') {
      if (!formCompra.fechaReserva || !formCompra.horaReserva) return alert("Por favor, ingresa fecha y hora de la reserva.");
      detallesExtra = ` | 🪑 Reserva: ${formCompra.fechaReserva} a las ${formCompra.horaReserva} (${formCompra.personas} pers)`;
    } else {
      detallesExtra = ` | 🏪 ${formCompra.tipoPedido}`;
    }

    const clienteFinalFormateado = `${formCompra.cliente} (Tel: ${formCompra.telefono}) (Pago: ${formCompra.referencia})${detallesExtra}`;

    const nuevoStockTallas = { ...tallasActuales, [formCompra.talla]: tallasActuales[formCompra.talla] - cant }
    await supabase.from('productos').update({ stock_tallas: nuevoStockTallas }).eq('id', prodSeleccionado.id)

    const nuevoPedido = {
      empresa_id: empresaId,
      cliente: clienteFinalFormateado, 
      red_social: formCompra.redSocial,
      producto_nombre: `${prodSeleccionado.nombre} | Opción: ${formCompra.talla}`,
      cantidad: cant,
      total: prodSeleccionado.precio * cant,
      estado: '⏳ Verificando Pago' 
    }

    const { error: errorPedido } = await supabase.from('pedidos').insert([nuevoPedido])

    if (errorPedido) return alert("Error al procesar el contrato: " + errorPedido.message)

    setMensaje("¡Contrato establecido! El comercio verificará tu pago y pedido en breve.")
    
    setFormCompra(prev => ({ 
      ...prev, cliente: '', telefono: '', productoId: '', talla: '', cantidad: 1, referencia: '', direccion: '', puntoReferencia: '', enlaceGps: '' 
    }))
    
    const { data: prods } = await supabase.from('productos').select('*').eq('empresa_id', empresaId)
    setCatalogo(prods?.filter(p => Object.values(p.stock_tallas || {}).some(cant => cant > 0)) || [])
  }

  const globalCSS = `
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 4px; }
  `

  if (!tienda) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-slate-500 uppercase tracking-widest">Buscando enlace comercial...</div>

  return (
    <div className="min-h-screen bg-linear-to-tr from-slate-900 via-slate-950 to-black p-4 sm:p-8 font-sans text-slate-200">
      <style>{globalCSS}</style>
      <div className="mx-auto max-w-5xl relative z-10">
        
        <div className="mb-6">
          <Link to="/" className="text-slate-500 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
            ← Ver otros comercios
          </Link>
        </div>

        <div className="mb-8 text-center rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-3">
          {tienda.logo_url && <img src={tienda.logo_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]" />}
          <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-red-500 to-yellow-500">
            {tienda.nombre_empresa}
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-700 px-3 py-1 rounded-full bg-slate-950/50">
            Soporte: {tienda.contacto}
          </p>
        </div>

        {mensaje && (
          <div className="mb-8 rounded-xl bg-emerald-900/30 p-6 text-center border border-emerald-500/30 text-emerald-400 font-bold shadow-lg backdrop-blur-md text-lg">
            ✅ {mensaje}
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-8 items-start">
          
          <div className="md:col-span-3 space-y-6">
            <h2 className="text-2xl font-black text-slate-200 border-b-2 border-slate-800 pb-2 uppercase tracking-widest">Catálogo Disponible</h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {catalogo.length === 0 ? (
                <p className="text-slate-500 italic col-span-2">No hay alijo disponible en este momento.</p>
              ) : (
                catalogo.map(p => (
                  <div key={p.id} className="bg-slate-900/60 p-4 rounded-2xl shadow-xl border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-sm flex flex-col h-full">
                    <div className="relative group rounded-xl overflow-hidden mb-4 bg-slate-950">
                      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full">
                        {p.galeria_urls && p.galeria_urls.length > 0 ? (
                          p.galeria_urls.map((url, i) => (
                            <img key={i} src={url} className="snap-center shrink-0 w-full aspect-square object-cover" alt={`${p.nombre} - vista ${i+1}`} />
                          ))
                        ) : (
                          p.imagen_url ? <img src={p.imagen_url} className="snap-center shrink-0 w-full aspect-square object-cover" /> : <div className="snap-center shrink-0 w-full aspect-square flex items-center justify-center text-slate-700">Sin Imagen</div>
                        )}
                      </div>
                      {p.galeria_urls?.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                          {p.galeria_urls.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50"></div>)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-lg text-white leading-tight">{p.nombre}</h3>
                        <span className="font-black text-transparent bg-clip-text bg-linear-to-r from-red-400 to-yellow-400 text-xl">${p.precio}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4 flex-1">{p.descripcion}</p>
                      
                      <div className="pt-3 border-t border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Opciones Disponibles:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(p.stock_tallas || {}).filter(entry => entry[1] > 0).map(([talla, cant]) => (
                            <div key={talla} className="text-center bg-slate-950 border border-slate-700 rounded p-1 min-w-[36px]">
                              <span className="block text-xs font-bold text-white px-1">{talla}</span>
                              <span className="block text-[9px] text-emerald-500">{cant} ud</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-2 sticky top-8 bg-slate-900/50 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest text-center border-b border-slate-800 pb-4">Reportar Pago y Pedido</h2>
            <form onSubmit={procesarCompra} className="space-y-5">
              
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700">
                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 block">Modalidad de Entrega</label>
                <select value={formCompra.tipoPedido} onChange={e => setFormCompra({...formCompra, tipoPedido: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer font-bold">
                  {tienda?.categoria === 'Comida y Restaurantes' ? (
                    <>
                      <option value="Delivery">🛵 Delivery</option>
                      <option value="Para Llevar">🥡 Para Llevar (Pick-up)</option>
                      <option value="Reservar Mesa">🪑 Reservar Mesa (Local)</option>
                    </>
                  ) : (
                    <>
                      <option value="Retiro en Tienda">🏪 Retiro en Tienda / Virtual</option>
                      <option value="Delivery">🚚 Delivery / Envíos</option>
                    </>
                  )}
                </select>
              </div>

              {formCompra.tipoPedido === 'Delivery' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  {/* SECCIÓN DEL GPS */}
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      {formCompra.enlaceGps ? '✅ Ubicación fijada' : 'Adjunta tu ubicación exacta:'}
                    </div>
                    <button type="button" onClick={obtenerUbicacionGPS} disabled={obteniendoGps || formCompra.enlaceGps !== ''} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-3 py-2 rounded font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors">
                      {obteniendoGps ? 'Cargando...' : (formCompra.enlaceGps ? '📍 GPS OK' : '📍 Usar GPS')}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Dirección de Entrega (Escrita)</label>
                    <input type="text" placeholder="Ej: Sector Alta Vista..." value={formCompra.direccion} onChange={e => setFormCompra({...formCompra, direccion: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Punto de Referencia</label>
                    <input type="text" placeholder="Ej: Casa azul portón blanco..." value={formCompra.puntoReferencia} onChange={e => setFormCompra({...formCompra, puntoReferencia: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
              )}

              {formCompra.tipoPedido === 'Reservar Mesa' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Fecha</label>
                      <input type="date" required value={formCompra.fechaReserva} onChange={e => setFormCompra({...formCompra, fechaReserva: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Hora</label>
                      <input type="time" required value={formCompra.horaReserva} onChange={e => setFormCompra({...formCompra, horaReserva: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cantidad de Personas</label>
                    <input type="number" min="1" required value={formCompra.personas} onChange={e => setFormCompra({...formCompra, personas: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 text-center font-bold" />
                  </div>
                </div>
              )}

              {/* SECCIÓN DE DATOS DE CONTACTO (NUEVO CAMPO DE TELÉFONO) */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Tu Nombre / Apellido</label>
                  <input type="text" required value={formCompra.cliente} onChange={e => setFormCompra({...formCompra, cliente: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-all" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Teléfono (WhatsApp)</label>
                  <input type="tel" required placeholder="Ej: 0414..." value={formCompra.telefono} onChange={e => setFormCompra({...formCompra, telefono: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-all" />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contacto por</label>
                  <select value={formCompra.redSocial} onChange={e => setFormCompra({...formCompra, redSocial: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-all cursor-pointer">
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Ref. Bancaria</label>
                  <input type="text" required placeholder="Ej. 123456" value={formCompra.referencia} onChange={e => setFormCompra({...formCompra, referencia: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">¿Qué vas a llevar?</label>
                <select required value={formCompra.productoId} onChange={e => setFormCompra({...formCompra, productoId: e.target.value, talla: ''})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 transition-all cursor-pointer">
                  <option value="">-- Seleccionar artículo --</option>
                  {catalogo.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>
                  ))}
                </select>
              </div>

              {formCompra.productoId && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex-2 w-full">
                    <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1 block">Opción Elegida</label>
                    <select required value={formCompra.talla} onChange={e => setFormCompra({...formCompra, talla: e.target.value})} className="w-full bg-slate-950/80 border border-yellow-500/50 p-3 rounded-xl text-yellow-500 font-bold focus:outline-none focus:border-yellow-400 transition-all cursor-pointer">
                      <option value="">Selecciona...</option>
                      {Object.entries(catalogo.find(p => p.id == formCompra.productoId)?.stock_tallas || {}).filter(entry => entry[1] > 0).map(entry => (
                        <option key={entry[0]} value={entry[0]}>{entry[0]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cantidad</label>
                    <input type="number" min="1" required value={formCompra.cantidad} onChange={e => setFormCompra({...formCompra, cantidad: e.target.value})} className="w-full bg-slate-950/50 border border-slate-700 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-center" />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-linear-to-r from-red-600 to-yellow-600 text-black font-black uppercase tracking-widest py-4 px-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all mt-6 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                Procesar Contrato
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DirectorioFixers />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/panel" element={<FixerDashboard />} />
      <Route path="/tienda/:empresaId" element={<EscaparateCliente />} />
    </Routes>
  )
}