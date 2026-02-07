// Fotos reales de la carpeta fotos/
var fotos = [
    'fotos/506308474_693648776594923_7359481999243944428_n.jpg',
    'fotos/506907024_692791456680655_2190111510403238674_n.jpg',
    'fotos/507194736_692788176680983_3169349664716361628_n.jpg',
    'fotos/572744897_801734919119641_2190010458311158536_n.jpg',
    'fotos/574572013_801731062453360_3640558971254746894_n.jpg',
    'fotos/595063494_829450953014704_2769575161832368103_n.jpg',
    'fotos/605590332_844440224849110_8890227255390076691_n.jpg',
    'fotos/606992825_844435804849552_3988808036130656006_n.jpg',
    'fotos/617465901_861498003143332_2710506214968967570_n.jpg',
    'fotos/618479547_861500199809779_1765721733810638916_n.jpg',
    'fotos/618699498_17915478105279895_2227795747309419666_n.jpeg',
    'fotos/619212929_17915861337279895_1902482287843309926_n.jpeg',
    'fotos/cumpleaños.jpg',
    'fotos/retrato.jpg'
];

var slider = document.getElementById('gallerySlider');
fotos.forEach(function(foto) {
    var item = document.createElement('div');
    item.className = 'gallery-item';
    var img = document.createElement('img');
    img.src = foto;
    img.loading = 'lazy';
    img.alt = 'Bodo Studio - Fotografía';
    item.appendChild(img);
    slider.appendChild(item);
});

// Slider scroll
function scrollGallery(dir) {
    var slider = document.getElementById('gallerySlider');
    var scrollAmount = 380;
    slider.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
}

// Section reveal
var revealSections = document.querySelectorAll('#estilos, #galeria, #inflables');
var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
revealSections.forEach(function(sec) { obs.observe(sec); });

// Camera scroll effect
var cameraBg = document.getElementById('cameraBg');
var cameraModel = document.getElementById('cameraModel');
var heroH = window.innerHeight;

function onScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var progress = Math.min(scrollY / (heroH * 0.6), 1);
    var eased = 1 - Math.pow(1 - progress, 2);
    var opacity = 0.7 - (eased * 0.7);
    var rotate = eased * 180;
    var moveX = eased * 300;
    var moveY = -50 + (eased * -20);
    var scale = 1 - (eased * 0.5);
    
    cameraBg.style.opacity = Math.max(opacity, 0);
    cameraBg.style.transform = 'translateY(' + moveY + '%) translateX(' + moveX + 'px) scale(' + scale + ') rotate(' + rotate + 'deg)';
    
    if (cameraModel) {
        var speed = 20 + (eased * 150);
        cameraModel.setAttribute('rotation-per-second', speed + 'deg');
    }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// MENÚ HAMBURGUESA
var menuToggle = document.querySelector('.menu-toggle');
var nav = document.querySelector('nav');

menuToggle.addEventListener('click', function() {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('active');
});

// Cerrar menú al hacer click en un enlace
document.querySelectorAll('nav a').forEach(function(link) {
    link.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
    });
});

// Cerrar menú al hacer click fuera
document.addEventListener('click', function(e) {
    if (!nav.contains(e.target) && !menuToggle.contains(e.target) && nav.classList.contains('active')) {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
    }
});

// BODOQUITOS - INFLABLES GALLERY
var inflables = [
    { img: 'fotos/inflables/foto1.jpeg', nombre: 'Castillo Pequeño', desc: 'Perfecto para los más pequeños, seguro y divertido' },
    { img: 'fotos/inflables/foto2.jpeg', nombre: 'Castillo Deportivo', desc: 'Ideal para niños activos, con área de juegos' },
    { img: 'fotos/inflables/foto3.jpeg', nombre: 'Tobogán de Agua', desc: 'Refrescante diversión para días calurosos' },
    { img: 'fotos/inflables/foto4.jpeg', nombre: 'Doble Túnel', desc: 'Aventura y emoción con doble recorrido' }
];

var inflablesGallery = document.getElementById('inflablesGallery');
var mostrandoTodos = false;
var INICIAL = 3;

function renderInflables() {
    inflablesGallery.innerHTML = '';
    inflables.forEach(function(item, index) {
        var div = document.createElement('div');
        div.className = 'inflable-item' + (index >= INICIAL && !mostrandoTodos ? ' hidden' : '');
        div.setAttribute('data-servicio', item.nombre);
        div.innerHTML = 
            '<button class="btn-agregar-carrito" onclick="toggleCarrito(this, \'' + item.nombre + '\', \'Bodoquitos - Inflables\', \'tent\')">+</button>' +
            '<img src="' + item.img + '" alt="' + item.nombre + '" loading="lazy">' +
            '<div class="inflable-overlay">' +
                '<h3>' + item.nombre + '</h3>' +
                '<p>' + item.desc + '</p>' +
            '</div>';
        inflablesGallery.appendChild(div);
    });
    
    if (inflables.length <= INICIAL) {
        document.getElementById('btnVerMasInflables').classList.add('hidden');
    }
}

function mostrarMasInflables() {
    mostrandoTodos = true;
    var items = document.querySelectorAll('.inflable-item');
    items.forEach(function(item, index) {
        if (index >= INICIAL) {
            item.classList.remove('hidden');
            item.classList.add('show');
            setTimeout(function() {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0) scale(1)';
            }, (index - INICIAL) * 100);
        }
    });
    document.getElementById('btnVerMasInflables').classList.add('hidden');
}

renderInflables();
lucide.createIcons();

// CARRITO DE COTIZACIÓN
var carrito = [];
var WHATSAPP_NUMERO = '50688880847';
var servicioTemporal = null;
var promoActual = null;

var promociones = {
    'Cámara 360°': {
        sugerir: 'PhotoRoom',
        titulo: '¿Y una cabina de fotos?',
        texto: 'Complementa tu Cámara 360° con nuestro PhotoRoom. Tus invitados tendrán fotos instantáneas para llevarse.',
        img: 'fotos/inflables/cabinafotoslocas.jpeg',
        icono: 'camera',
        btnTexto: 'Agregar PhotoRoom'
    },
    'PhotoRoom': {
        sugerir: 'Cámara 360°',
        titulo: '¿Agregamos el 360°?',
        texto: 'Dale un toque épico a tu evento con videos 360° que tus invitados amarán compartir.',
        img: 'fotos/inflables/insta360.jpeg',
        icono: 'rotate-3d',
        btnTexto: 'Agregar Cámara 360°'
    }
};

var serviciosConUbicacion = ['Retratos', 'Bebés'];

function eventosSeleccionado() {
    return carrito.some(function(item) {
        return item.nombre === 'Eventos';
    });
}

function actualizarExtras() {
    var extrasSection = document.getElementById('extrasEventos');
    if (eventosSeleccionado()) {
        extrasSection.classList.add('activo');
        setTimeout(function() { lucide.createIcons(); }, 100);
    } else {
        extrasSection.classList.remove('activo');
        carrito = carrito.filter(function(item) {
            if (item.categoria === 'Extra Evento') {
                var btn = document.querySelector('[data-servicio="' + item.nombre + '"] .btn-agregar-carrito');
                if (btn) {
                    btn.classList.remove('agregado');
                    btn.innerHTML = '+';
                }
                return false;
            }
            return true;
        });
    }
}

function toggleCarrito(btn, nombre, categoria, icono) {
    var index = carrito.findIndex(function(item) {
        return item.nombre === nombre;
    });

    if (index === -1) {
        if (serviciosConUbicacion.indexOf(nombre) !== -1) {
            servicioTemporal = { btn: btn, nombre: nombre, categoria: categoria, icono: icono };
            abrirModal(nombre, icono);
            return;
        }
        
        carrito.push({ nombre: nombre, categoria: categoria, icono: icono });
        btn.classList.add('agregado');
        btn.innerHTML = '✓';
        
        if (nombre === 'Eventos') {
            actualizarExtras();
        }
        
        if (promociones[nombre]) {
            mostrarPromocion(nombre);
        }
    } else {
        carrito.splice(index, 1);
        btn.classList.remove('agregado');
        btn.innerHTML = '+';
        
        if (nombre === 'Eventos') {
            actualizarExtras();
        }
    }

    actualizarCarritoUI();
}

function abrirModal(nombre, icono) {
    var modal = document.getElementById('modalOpciones');
    var titulo = document.getElementById('modalTitulo');
    titulo.innerHTML = nombre;
    modal.classList.add('visible');
    setTimeout(function() { lucide.createIcons(); }, 50);
}

function cerrarModal() {
    var modal = document.getElementById('modalOpciones');
    modal.classList.remove('visible');
    servicioTemporal = null;
}

function seleccionarOpcion(opcion) {
    if (!servicioTemporal) return;
    
    var nombreConOpcion = servicioTemporal.nombre + ' (' + opcion + ')';
    
    carrito.push({ 
        nombre: nombreConOpcion, 
        categoria: servicioTemporal.categoria, 
        icono: servicioTemporal.icono 
    });
    
    servicioTemporal.btn.classList.add('agregado');
    servicioTemporal.btn.innerHTML = '✓';
    
    cerrarModal();
    actualizarCarritoUI();
}

document.getElementById('modalOpciones').addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

function togglePanelCarrito() {
    var panel = document.getElementById('carritoPanel');
    panel.classList.toggle('visible');
    setTimeout(function() { lucide.createIcons(); }, 50);
}

function actualizarCarritoUI() {
    var contador = document.getElementById('carritoContador');
    var itemsContainer = document.getElementById('carritoItems');
    var btnEnviar = document.getElementById('btnEnviarWhatsApp');

    contador.textContent = carrito.length;
    if (carrito.length > 0) {
        contador.classList.add('visible');
    } else {
        contador.classList.remove('visible');
    }

    if (carrito.length === 0) {
        itemsContainer.innerHTML = 
            '<div class="carrito-vacio">' +
                '<div class="carrito-vacio-icon"><i data-lucide="package" style="width:40px;height:40px;"></i></div>' +
                '<p>Tu carrito está vacío</p>' +
                '<p style="font-size: 12px; margin-top: 5px;">Agrega servicios para cotizar</p>' +
            '</div>';
        btnEnviar.disabled = true;
    } else {
        var html = '';
        carrito.forEach(function(item, idx) {
            html += 
                '<div class="carrito-item">' +
                    '<div class="carrito-item-info">' +
                        '<span class="carrito-item-icon"><i data-lucide="' + item.icono + '" style="width:24px;height:24px;"></i></span>' +
                        '<div>' +
                            '<div class="carrito-item-nombre">' + item.nombre + '</div>' +
                            '<div class="carrito-item-cat">' + item.categoria + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<button class="carrito-item-quitar" onclick="quitarDelCarrito(' + idx + ')"><i data-lucide="x" style="width:16px;height:16px;"></i></button>' +
                '</div>';
        });
        itemsContainer.innerHTML = html;
        btnEnviar.disabled = false;
    }
    
    setTimeout(function() { lucide.createIcons(); }, 50);
}

function quitarDelCarrito(index) {
    var item = carrito[index];
    var nombreBase = item.nombre.split(' (')[0];
    carrito.splice(index, 1);

    var botones = document.querySelectorAll('.btn-agregar-carrito');
    botones.forEach(function(btn) {
        var card = btn.closest('[data-servicio]');
        if (card && (card.dataset.servicio === item.nombre || card.dataset.servicio === nombreBase)) {
            btn.classList.remove('agregado');
            btn.innerHTML = '+';
        }
    });

    document.querySelectorAll('.inflable-item').forEach(function(el) {
        if (el.dataset.servicio === item.nombre) {
            var btn = el.querySelector('.btn-agregar-carrito');
            if (btn) {
                btn.classList.remove('agregado');
                btn.innerHTML = '+';
            }
        }
    });

    if (nombreBase === 'Eventos') {
        actualizarExtras();
    }

    actualizarCarritoUI();
}

function limpiarCarrito() {
    carrito = [];
    
    document.querySelectorAll('.btn-agregar-carrito').forEach(function(btn) {
        btn.classList.remove('agregado');
        btn.innerHTML = '+';
    });

    actualizarExtras();
    actualizarCarritoUI();
}

function enviarWhatsApp() {
    if (carrito.length === 0) return;

    var mensaje = 'Hola, estoy interesado en los siguientes servicios:\n\n';
    
    var categorias = {};
    carrito.forEach(function(item) {
        if (!categorias[item.categoria]) {
            categorias[item.categoria] = [];
        }
        categorias[item.categoria].push('• ' + item.nombre);
    });

    for (var cat in categorias) {
        mensaje += '*' + cat + ':*\n';
        categorias[cat].forEach(function(servicio) {
            mensaje += servicio + '\n';
        });
        mensaje += '\n';
    }

    mensaje += '¿Me podrían brindar más información sobre disponibilidad y precios? Gracias.';

    var url = 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);
    window.open(url, '_blank');
}

document.addEventListener('click', function(e) {
    var panel = document.getElementById('carritoPanel');
    var flotante = document.querySelector('.carrito-flotante');
    
    if (panel.classList.contains('visible') && 
        !panel.contains(e.target) && 
        !flotante.contains(e.target)) {
        panel.classList.remove('visible');
    }
});

function mostrarPromocion(servicioAgregado) {
    var promo = promociones[servicioAgregado];
    if (!promo) return;
    
    var yaAgregado = carrito.some(function(item) {
        return item.nombre === promo.sugerir;
    });
    
    if (yaAgregado) return;
    
    promoActual = promo;
    
    document.getElementById('promoImg').src = promo.img;
    document.getElementById('promoTitulo').textContent = promo.titulo;
    document.getElementById('promoTexto').textContent = promo.texto;
    document.getElementById('promoBtnTexto').textContent = promo.btnTexto;
    
    var toast = document.getElementById('promoToast');
    toast.classList.add('visible');
    
    setTimeout(function() { lucide.createIcons(); }, 50);
    
    setTimeout(function() {
        cerrarPromo();
    }, 10000);
}

function cerrarPromo() {
    var toast = document.getElementById('promoToast');
    toast.classList.remove('visible');
    promoActual = null;
}

function agregarPromo() {
    if (!promoActual) return;
    
    var nombre = promoActual.sugerir;
    var icono = promoActual.icono;
    
    carrito.push({ nombre: nombre, categoria: 'Extra Evento', icono: icono });
    
    var btn = document.querySelector('[data-servicio="' + nombre + '"] .btn-agregar-carrito');
    if (btn) {
        btn.classList.add('agregado');
        btn.innerHTML = '✓';
    }
    
    cerrarPromo();
    actualizarCarritoUI();
}
