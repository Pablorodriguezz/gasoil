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

// 2. Función para guardar o actualizar con SweetAlert
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

    // Mostramos un cargando...
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

    let resultado;
    if (editandoID) {
        resultado = await supabaseClient.from('repostajes').update(datos).eq('id', editandoID);
    } else {
        resultado = await supabaseClient.from('repostajes').insert([datos]);
    }

    if (resultado.error) {
        Swal.fire('¡Error!', resultado.error.message, 'error');
    } else {
        Swal.fire({
            icon: 'success',
            title: editandoID ? '¡Actualizado!' : '¡Registrado!',
            text: 'Los datos se han guardado correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        resetearFormulario();
        cargarRegistros();
    }
});

// 3. Función para borrar con confirmación visual
window.borrarRegistro = async function(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('repostajes').delete().eq('id', id);
        
        if (error) {
            Swal.fire('Error', 'No se pudo borrar el registro', 'error');
        } else {
            Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
            cargarRegistros();
        }
    }
};

// --- MANTENER RESTO DE FUNCIONES (cargarRegistros, prepararEdicion, resetearFormulario) ---

async function cargarRegistros(fechaFiltro = null) {
    let query = supabaseClient.from('repostajes').select('*').order('fecha', { ascending: false });
    if (fechaFiltro) query = query.eq('fecha', fechaFiltro);
    else query = query.limit(10);

    const { data, error } = await query;
    if (error) return;

    lista.innerHTML = '';
    data.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'list-group-item shadow-sm mb-2 rounded bg-white';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1 text-primary fw-bold">${reg.vehiculo}</h6>
                <small class="text-muted">${reg.fecha}</small>
            </div>
            <p class="mb-1"><b>${reg.responsable}</b>: ${reg.litros}L</p>
            <div class="d-flex gap-2 mt-2">
                <button class="btn btn-sm btn-outline-warning" onclick='prepararEdicion(${JSON.stringify(reg)})'>Editar</button>
                <button class="btn btn-sm btn-outline-danger" onclick="borrarRegistro(${reg.id})">Borrar</button>
            </div>
        `;
        lista.appendChild(item);
    });
}

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

function resetearFormulario() {
    form.reset();
    editandoID = null;
    submitBtn.innerText = "GUARDAR REGISTRO";
    submitBtn.classList.replace('btn-success', 'btn-primary');
}

filtro.addEventListener('change', (e) => cargarRegistros(e.target.value));
cargarRegistros();