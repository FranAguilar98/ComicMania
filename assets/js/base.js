/* =====================================================
   ComicMania - base.js  (jQuery + Fetch API)

   Este archivo se usa en index.html, producto.html y contacto.html.
   Cada bloque solo actúa si su elemento existe en la página
   (en jQuery, $("#algo") sobre algo que no existe simplemente no hace nada).

   IMPORTANTE: en el HTML se carga con "defer", después de jQuery.
   ===================================================== */

// ---------- Datos y estado de la aplicación ----------
const RUTA_PRODUCTOS = './assets/js/datos.json';
const RETARDO_SIMULADO = 1000;              // milisegundos. Simula un servidor lento para que se vea "Cargando..." (pon 0 para quitarlo)
const CLAVE_CARRITO = 'carritoComicMania';  // nombre con que se guarda el carrito en el navegador

let comics = [];                // productos cargados desde datos.json
let carrito = [];               // productos agregados: { id, titulo, precio }
let categoriaActual = 'todos';  // categoría elegida (viene de la URL: producto.html?categoria=Acción)
let textoBusqueda = '';         // texto escrito en el buscador


/* =====================================================
   1. UTILIDADES
   ===================================================== */

/** Convierte 8990 en $8.990 (pesos chilenos). */
function formatearPrecio(precio) {
    return precio.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP'
    });
}


/* =====================================================
   2. FETCH API: cargar productos desde datos.json
   ===================================================== */

/** Pide el JSON y, si todo sale bien, muestra los productos. Si falla, muestra un mensaje amigable. */
async function cargarProductos() {
    try {
        const respuesta = await fetch(RUTA_PRODUCTOS);

        // fetch NO lanza error con un 404 o un 500, hay que revisarlo a mano
        if (!respuesta.ok) {
            throw new Error('Error HTTP ' + respuesta.status);
        }

        comics = await respuesta.json();
        mostrarProductos();
    } catch (error) {
        console.error('No se pudieron cargar los productos:', error);
        $("#indicador-error").show();
    } finally {
        // finally se ejecuta siempre: escondemos el "Cargando..."
        $("#indicador-carga").hide();
    }
}


/* =====================================================
   3. MOSTRAR PRODUCTOS (manipulación del DOM)
   ===================================================== */

/** Devuelve los productos que cumplen la categoría y la búsqueda actuales. */
function obtenerProductosFiltrados() {
    return comics.filter(function (comic) {
        const coincideCategoria = categoriaActual === 'todos' || comic.categoria === categoriaActual;
        const coincideBusqueda = comic.titulo.toLowerCase().includes(textoBusqueda.toLowerCase());
        return coincideCategoria && coincideBusqueda;
    });
}

/** Devuelve el HTML de la tarjeta de UN producto (imagen, título, autor, precio y botón). */
function crearTarjeta(comic) {
    return `<div class="card m-2">
        <img src="${comic.img}" class="card-img-top" alt="Portada de ${comic.titulo}">
        <div class="card-body d-flex flex-column">
            <h2 class="card-title h5">${comic.titulo}</h2>
            <p class="card-text mb-1">${comic.autor}</p>
            <p class="mb-2"><span class="etiqueta">${comic.categoria}</span></p>
            <p class="precio mt-auto mb-2">${formatearPrecio(comic.precio)}</p>
            <button type="button" class="btn btn-primary btn-agregar" data-id="${comic.id}">Agregar al carrito</button>
        </div>
    </div>`;
}

/** Dibuja las tarjetas dentro de #lista-productos.
    - En index.html la lista trae data-max="3": muestra solo los primeros 3 (destacados).
    - En producto.html muestra todos, respetando categoría y búsqueda. */
function mostrarProductos() {
    const $contenedor = $("#lista-productos");
    if ($contenedor.length === 0 || comics.length === 0) return;

    const maximo = Number($contenedor.data("max"));
    let lista;

    if (maximo) {
        lista = comics.slice(0, maximo);
    } else {
        lista = obtenerProductosFiltrados();

        $("#titulo-productos").text(categoriaActual === 'todos' ? 'Todos los cómics' : categoriaActual);

        // aria-live en el HTML hace que los lectores de pantalla lean este mensaje
        if (lista.length === 0) {
            $("#info-resultados").text('No encontramos cómics con esos criterios. Prueba con otra búsqueda o categoría.');
        } else {
            $("#info-resultados").text(lista.length + ' cómic(s) disponible(s)');
        }
    }

    $contenedor.empty();   // borramos las tarjetas anteriores
    lista.forEach(function (comic) {
        $contenedor.append(crearTarjeta(comic));
    });
}


/* =====================================================
   4. CARRITO DE COMPRAS
   ===================================================== */

/** Lee el carrito guardado en el navegador (así no se pierde al cambiar de página). */
function leerCarrito() {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
        carrito = Array.isArray(guardado) ? guardado : [];
    } catch (error) {
        carrito = [];
    }
}

/** Guarda el carrito en el navegador. */
function guardarCarrito() {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch (error) {
        console.error('No se pudo guardar el carrito:', error);
    }
}

/** Agrega un cómic al carrito. Igual que en el ejemplo del profe: no se repite el mismo producto. */
function agregarACarrito(id) {
    if (carrito.some(function (item) { return item.id === id; })) {
        alert("Cómic ya incorporado al carrito.");
        return;
    }

    const comic = comics.find(function (c) { return c.id === id; });
    if (!comic) return;

    carrito.push({ id: comic.id, titulo: comic.titulo, precio: comic.precio });
    guardarCarrito();
    mostrarCarrito();
}

/** Saca un producto del carrito. */
function quitarDelCarrito(id) {
    carrito = carrito.filter(function (item) { return item.id !== id; });
    guardarCarrito();
    mostrarCarrito();
}

/** Deja el carrito vacío. */
function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    mostrarCarrito();
}

/** Suma los precios de todos los productos del carrito. */
function calcularTotal() {
    return carrito.reduce(function (suma, item) { return suma + item.precio; }, 0);
}

/** Dibuja el resumen del carrito en su área de la página. */
function mostrarCarrito() {
    const $lista = $("#lista-carrito");
    if ($lista.length === 0) return;   // esta página no tiene carrito

    $lista.empty();
    carrito.forEach(function (item) {
        // Se arma con .text() para que ningún texto se interprete como HTML
        const $fila = $('<li class="list-group-item px-0 d-flex justify-content-between align-items-center gap-2"></li>');
        const $texto = $('<div></div>');
        $texto.append($('<div class="fw-semibold"></div>').text(item.titulo));
        $texto.append($('<div class="small"></div>').text(formatearPrecio(item.precio)));

        const $quitar = $('<button type="button" class="btn btn-secundario btn-sm btn-quitar">Quitar</button>')
            .attr("data-id", item.id)
            .attr("aria-label", "Quitar " + item.titulo + " del carrito");

        $fila.append($texto, $quitar);
        $lista.append($fila);
    });

    const hayProductos = carrito.length > 0;
    $("#carrito-vacio").toggle(!hayProductos);   // mensaje "vacío"
    $("#carrito-total").toggle(hayProductos);    // total y botón de vaciar
    $("#total-precio").text(formatearPrecio(calcularTotal()));
    $("#contador-carrito").text(carrito.length).attr("aria-label", carrito.length + " productos");
}


/* =====================================================
   5. EVENTOS
   ===================================================== */

/** EVENTO SUBMIT: formulario de búsqueda (producto.html). */
function buscarProductos(evento) {
    evento.preventDefault();   // evita que la página se recargue
    textoBusqueda = $("#busqueda").val().trim();
    mostrarProductos();
}

/** Revisa que el correo tenga forma de correo (algo@dominio.cl). */
function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

/** Muestra el mensaje de error de un campo y lo marca como inválido (para lectores de pantalla). */
function marcarCampoInvalido(idCampo, idError) {
    $(idError).show();
    $(idCampo).attr("aria-invalid", "true");
}

/** EVENTO SUBMIT: formulario de contacto (contacto.html).
    Misma idea del profe: ocultar errores, revisar campos, mostrar errores. */
function enviarContacto(evento) {
    // IMPORTANTE: sin esta línea el formulario se envía solo, la página se recarga
    // y los mensajes de error desaparecen en menos de un segundo.
    evento.preventDefault();

    let nombre = $("#contacto-nombre").val().trim();
    let correo = $("#contacto-correo").val().trim();
    let motivo = $("#contacto-motivo").val();
    let detalle = $("#contacto-detalle").val().trim();

    $(".error-campo").hide();
    $("#form-contacto [aria-invalid]").removeAttr("aria-invalid");
    let error = false;
    let primerCampo = null;   // primer campo que falló: ahí se lleva el cursor

    if (nombre == "") {
        marcarCampoInvalido("#contacto-nombre", "#error-nombre");
        if (!primerCampo) primerCampo = "#contacto-nombre";
        error = true;
    }

    if (!correoValido(correo)) {
        marcarCampoInvalido("#contacto-correo", "#error-correo");
        if (!primerCampo) primerCampo = "#contacto-correo";
        error = true;
    }

    if (motivo == "") {
        marcarCampoInvalido("#contacto-motivo", "#error-motivo");
        if (!primerCampo) primerCampo = "#contacto-motivo";
        error = true;
    }

    if (detalle == "") {
        marcarCampoInvalido("#contacto-detalle", "#error-detalle");
        if (!primerCampo) primerCampo = "#contacto-detalle";
        error = true;
    }

    if (error) {
        $(primerCampo).trigger("focus");   // lleva el cursor (y la vista) al primer campo con error
        return;
    }

    alert("Hemos enviado su requerimiento!");
    evento.target.reset();   // limpia el formulario
}


/* =====================================================
   6. INICIO (cuando la página está lista)
   ===================================================== */

$(document).ready(function () {

    // Categoría que viene en la URL, por ejemplo producto.html?categoria=Acción
    const params = new URLSearchParams(window.location.search);
    if (params.get("categoria")) {
        categoriaActual = params.get("categoria");
    }

    // Carrito guardado
    leerCarrito();
    mostrarCarrito();

    // Productos (solo en las páginas que tienen #lista-productos)
    if ($("#lista-productos").length) {
        setTimeout(cargarProductos, RETARDO_SIMULADO);
    }

    // EVENTO CLICK: "Agregar al carrito". Se escucha en el contenedor porque las tarjetas se crean después.
    $("#lista-productos").on("click", ".btn-agregar", function () {
        agregarACarrito(Number($(this).data("id")));
    });

    // EVENTO CLICK: botones del carrito
    $("#lista-carrito").on("click", ".btn-quitar", function () {
        quitarDelCarrito(Number($(this).data("id")));
    });
    $("#btn-vaciar").on("click", vaciarCarrito);

    // EVENTOS SUBMIT
    $("#form-busqueda").on("submit", buscarProductos);
    $("#form-contacto").on("submit", enviarContacto);
});