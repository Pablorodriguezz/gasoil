// 1. Configuración de Supabase
const SUPABASE_URL = 'https://bqyrikcmlnvupwhlfqwa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f2VKj89-BsYcU8f2oQDXug_p-fdtqkz';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos del DOM
const form = document.getElementById('gasoilForm');
const lista = document.getElementById('listaRegistros');
const filtro = document.getElementById('filtroFecha');
const submitBtn = form.querySelector('button[type="submit"]');

let editandoID = null;

// 2. Función para GUARDAR o ACTUALIZAR
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
        fecha: document.getElementById('fecha').value,
        responsable: document.getElementById('responsable').value,
        vehiculo: document.getElementById('vehiculo').value,
        km_previos: parseInt(document.getElementById('km_previos').value),
        litros: parseFloat(document.getElementById('litros').value),
        contador_tras_carga: parseInt(document.getElementById('contador').value)
    };

    Swal.fire({ 
        title: 'Procesando...', 
        allowOutsideClick: false, 
        didOpen: () => { Swal.showLoading() } 
    });

    let resultado;

    if (editandoID) {
        // MODO EDICIÓN: .select() es clave para confirmar que la RLS permitió el cambio
        resultado = await supabaseClient
            .from('repostajes')
            .update(datos)
            .eq('id', editandoID)
            .select();
    } else {
        // MODO CREACIÓN
        resultado = await supabaseClient
            .from('repostajes')
            .insert([datos])
            .select();
    }

    // Si data viene vacío pero no hay error, suele ser fallo de permisos RLS
    if (resultado.error || (resultado.data && resultado.data.length === 0)) {
        Swal.fire('¡Error!', 'No se pudo guardar. Revisa las políticas RLS (UPDATE/INSERT) en Supabase.', 'error');
    } else {
        Swal.fire({
            icon: 'success',
            title: editandoID ? '¡Actualizado!' : '¡Registrado!',
            text: 'Operación realizada con éxito',
            timer: 1500,
            showConfirmButton: false
        });
        resetearFormulario();
        cargarRegistros();
    }
});

// 3. Función para BORRAR
window.borrarRegistro = async function(id) {
    const result = await Swal.fire({
        title: '¿Borrar registro?',
        text: "Esta acción eliminará el dato de la base de datos.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { data, error } = await supabaseClient
            .from('repostajes')
            .delete()
            .eq('id', id)
            .select();
        
        if (error || (data && data.length === 0)) {
            Swal.fire('Error', 'No se pudo eliminar. Revisa la política DELETE en Supabase.', 'error');
        } else {
            Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
            cargarRegistros();
        }
    }
};

// 4. Función para CARGAR y FILTRAR
async function cargarRegistros(fechaFiltro = null) {
    let query = supabaseClient
        .from('repostajes')
        .select('*')
        .order('fecha', { ascending: false });

    if (fechaFiltro) {
        query = query.eq('fecha', fechaFiltro);
    } else {
        query = query.limit(10);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error cargando datos:", error.message);
        return;
    }

    lista.innerHTML = '';
    
    if (data.length === 0) {
        lista.innerHTML = '<div class="text-center text-muted">No hay registros.</div>';
        return;
    }

    data.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'list-group-item shadow-sm mb-2 rounded bg-white';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1 text-primary fw-bold">${reg.vehiculo}</h6>
                <small class="text-muted fw-bold">${reg.fecha}</small>
            </div>
            <p class="mb-1"><b>${reg.responsable}</b> cargó <b>${reg.litros}L</b></p>
            <small class="text-muted d-block mb-2">KM: ${reg.km_previos} → Contador: ${reg.contador_tras_carga}</small>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-warning" onclick='prepararEdicion(${JSON.stringify(reg)})'>Editar</button>
                <button class="btn btn-sm btn-danger" onclick="borrarRegistro(${reg.id})">Borrar</button>
            </div>
        `;
        lista.appendChild(item);
    });
}

// 5. Preparar formulario para EDITAR
window.prepararEdicion = function(reg) {
    editandoID = reg.id;
    
    document.getElementById('fecha').value = reg.fecha;
    document.getElementById('responsable').value = reg.responsable;
    document.getElementById('vehiculo').value = reg.vehiculo;
    document.getElementById('km_previos').value = reg.km_previos;
    document.getElementById('litros').value = reg.litros;
    document.getElementById('contador').value = reg.contador_tras_carga;

    submitBtn.innerText = "ACTUALIZAR DATOS";
    submitBtn.classList.replace('btn-primary', 'btn-success');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 6. Resetear formulario
function resetearFormulario() {
    form.reset();
    editandoID = null;
    submitBtn.innerText = "GUARDAR REGISTRO";
    submitBtn.classList.replace('btn-success', 'btn-primary');
}

// Eventos
filtro.addEventListener('change', (e) => cargarRegistros(e.target.value));

// Carga inicial
cargarRegistros();