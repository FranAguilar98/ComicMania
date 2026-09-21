
const RUTA_PRODUCTOS = './assets/js/datos.json';
const RETARDO_SIMULADO = 1000;              
const CLAVE_CARRITO = 'carritoComicMania';  

let comics = [];                
let carrito = [];               
let categoriaActual = 'todos';  
let textoBusqueda = '';         


function formatearPrecio(precio) {
    return precio.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP'
    });
}



async function cargarProductos() {
    try {
        const respuesta = await fetch(RUTA_PRODUCTOS);
        if (!respuesta.ok) {
            throw new Error('Error HTTP ' + respuesta.status);
        }
        comics = await respuesta.json();
        mostrarProductos();
    } catch (error) {
        console.error('No se pudieron cargar los productos:', error);
        $("#indicador-error").show();
    } finally {
        $("#indicador-carga").hide();
    }
}

function obtenerProductosFiltrados() {
    return comics.filter(function (comic) {
        const coincideCategoria = categoriaActual === 'todos' || comic.categoria === categoriaActual;
        const coincideBusqueda = comic.titulo.toLowerCase().includes(textoBusqueda.toLowerCase());
        return coincideCategoria && coincideBusqueda;
    });
}

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
        if (lista.length === 0) {
            $("#info-resultados").text('No encontramos cómics con esos criterios. Prueba con otra búsqueda o categoría.');
        } else {
            $("#info-resultados").text(lista.length + ' cómic(s) disponible(s)');
        }
    }

    $contenedor.empty();  
    lista.forEach(function (comic) {
        $contenedor.append(crearTarjeta(comic));
    });
}

function leerCarrito() {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
        carrito = Array.isArray(guardado) ? guardado : [];
    } catch (error) {
        carrito = [];
    }
}

function guardarCarrito() {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch (error) {
        console.error('No se pudo guardar el carrito:', error);
    }
}

function agregarACarrito(id) {
    if (carrito.some(function (item) { return item.id === id; })) {
        alert("Cómic ya incorporado al carrito.");
        return;
    }

    const comic = comics.find(function (c) { return c.id === id; });
    if (!comic) return;

    carrito.push({ id: comic.id, titulo: comic.titulo, precio: comic.precio });
    guardarCarrito();
    console.log("ID agregado al carrito:", id);
    mostrarCarrito();
    alert("Producto agregado al carrito.");
}

function quitarDelCarrito(id) {
    carrito = carrito.filter(function (item) { return item.id !== id; });
    guardarCarrito();
    mostrarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    mostrarCarrito();
}

function calcularTotal() {
    return carrito.reduce(function (suma, item) { return suma + item.precio; }, 0);
}

function mostrarCarrito() {
    const $lista = $("#lista-carrito");
    if ($lista.length === 0) return;  

    $lista.empty();
    carrito.forEach(function (item) {
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
    $("#carrito-vacio").toggle(!hayProductos);   
    $("#carrito-total").toggle(hayProductos);    
    $("#total-precio").text(formatearPrecio(calcularTotal()));
    $("#contador-carrito").text(carrito.length).attr("aria-label", carrito.length + " productos");
}

function buscarProductos(evento) {
    evento.preventDefault();   
    textoBusqueda = $("#busqueda").val().trim();
    mostrarProductos();
}

function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function marcarCampoInvalido(idCampo, idError) {
    $(idError).show();
    $(idCampo).attr("aria-invalid", "true");
}

function enviarContacto(evento) {
    evento.preventDefault();

    let nombre = $("#contacto-nombre").val().trim();
    let correo = $("#contacto-correo").val().trim();
    let motivo = $("#contacto-motivo").val();
    let detalle = $("#contacto-detalle").val().trim();

    $(".error-campo").hide();
    $("#form-contacto [aria-invalid]").removeAttr("aria-invalid");
    let error = false;
    let primerCampo = null;   

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
        $(primerCampo).trigger("focus");   
        return;
    }

    alert("Hemos enviado su requerimiento!");
    evento.target.reset();   
}


$(document).ready(function () {

    
    const params = new URLSearchParams(window.location.search);
    if (params.get("categoria")) {
        categoriaActual = params.get("categoria");
    }

    leerCarrito();
    mostrarCarrito();

    if ($("#lista-productos").length) {
        setTimeout(cargarProductos, RETARDO_SIMULADO);
    }

    $("#lista-productos").on("click", ".btn-agregar", function () {
        agregarACarrito(Number($(this).data("id")));
    });

    $("#lista-carrito").on("click", ".btn-quitar", function () {
        quitarDelCarrito(Number($(this).data("id")));
    });
    $("#btn-vaciar").on("click", vaciarCarrito);

    $("#form-busqueda").on("submit", buscarProductos);
    $("#form-contacto").on("submit", enviarContacto);
});