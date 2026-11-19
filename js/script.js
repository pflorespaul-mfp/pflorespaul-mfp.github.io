/* =========================================================
   ENCORE - GRUPO 4 | JavaScript único para todo el sitio
   - Paneles desplegables (tarjetas y acordeones)
   - Formularios de consultas
   - Videos (se cargan desde data-video-id)
   - Ejercicios interactivos
========================================================= */
(function () {
    'use strict';

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------------------------------------------------------
       1. PANELES DESPLEGABLES
       Botón:  <button aria-controls="id-del-panel" [data-group="x"]>
       Panel:  <div id="id-del-panel" class="collapsible">
    --------------------------------------------------------- */
    var DURACION = 500; // ms (un poco mayor que la transición CSS)

    function actualizarBotones(panel, abierto) {
        $$('[aria-controls="' + panel.id + '"]').forEach(function (btn) {
            btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
            btn.classList.toggle('active', abierto);
            var info = $('.click-info', btn);
            if (info) {
                info.textContent = abierto ? 'Haz clic para cerrar ▲' : 'Haz clic para aprender más ▼';
            }
        });
    }

    function abrirPanel(panel, instantaneo) {
        clearTimeout(panel._timer);
        panel.classList.add('open');
        actualizarBotones(panel, true);

        if (instantaneo) {
            panel.style.maxHeight = 'none';
            return;
        }
        panel.style.maxHeight = panel.scrollHeight + 'px';
        // Al terminar, se libera la altura para que paneles anidados puedan crecer
        panel._timer = setTimeout(function () {
            if (panel.classList.contains('open')) { panel.style.maxHeight = 'none'; }
        }, DURACION);
    }

    function cerrarPanel(panel) {
        clearTimeout(panel._timer);
        // Fija la altura actual para poder animar desde ella
        panel.style.maxHeight = panel.scrollHeight + 'px';
        void panel.offsetHeight; // fuerza el reflow
        panel.classList.remove('open');
        panel.style.maxHeight = '0px';
        actualizarBotones(panel, false);
    }

    function alternarPanel(boton) {
        var panel = document.getElementById(boton.getAttribute('aria-controls'));
        if (!panel) { return; }
        var estabaAbierto = panel.classList.contains('open');

        // Cierra los demás paneles del mismo grupo (comportamiento exclusivo)
        var grupo = boton.getAttribute('data-group');
        if (grupo && !estabaAbierto) {
            $$('[data-group="' + grupo + '"]').forEach(function (otro) {
                var p = document.getElementById(otro.getAttribute('aria-controls'));
                if (p && p !== panel && p.classList.contains('open')) { cerrarPanel(p); }
            });
        }

        if (estabaAbierto) {
            cerrarPanel(panel);
        } else {
            abrirPanel(panel, false);
            if (boton.classList.contains('card')) {
                setTimeout(function () {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 120);
            }
        }
    }

    function iniciarPaneles() {
        document.addEventListener('click', function (e) {
            var boton = e.target.closest('button[aria-controls]');
            if (boton) { alternarPanel(boton); }
        });
        abrirDesdeHash();
        window.addEventListener('hashchange', abrirDesdeHash);
    }

    // Permite enlaces como contenido.html#tema-proporcionalidad
    function abrirDesdeHash() {
        var id = decodeURIComponent(location.hash.slice(1));
        var destino = id && document.getElementById(id);
        if (!destino) { return; }

        var cadena = [];
        var nodo = destino;
        while (nodo && nodo !== document.body) {
            if (nodo.classList && nodo.classList.contains('collapsible')) { cadena.unshift(nodo); }
            nodo = nodo.parentElement;
        }
        if (!cadena.length) { return; }

        cadena.forEach(function (p) { abrirPanel(p, true); });
        setTimeout(function () {
            destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /* ---------------------------------------------------------
       2. FORMULARIOS (sin servidor: solo confirmación en pantalla)
    --------------------------------------------------------- */
    function iniciarFormularios() {
        $$('form.js-form').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var msg = $('.form-message', form);
                var nombre = (form.elements.nombre && form.elements.nombre.value.trim()) || '';
                if (msg) {
                    msg.textContent = '¡Gracias' + (nombre ? ', ' + nombre : '') +
                        '! Tu consulta fue enviada (modo demostración).';
                }
                form.reset();
            });
        });
    }

    /* ---------------------------------------------------------
       3. VIDEOS: <div class="video-frame" data-video-id="ID_DE_YOUTUBE">
          Si el ID está vacío se muestra un marcador de posición.
    --------------------------------------------------------- */
    function iniciarVideos() {
        $$('.video-frame').forEach(function (marco) {
            var id = (marco.getAttribute('data-video-id') || '').trim();
            if (!/^[\w-]{11}$/.test(id)) { return; } // deja el marcador visible
            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + id;
            iframe.title = marco.getAttribute('data-title') || 'Video educativo';
            iframe.loading = 'lazy';
            iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            marco.innerHTML = '';
            marco.appendChild(iframe);
        });
    }

    /* ---------------------------------------------------------
       4. EJERCICIOS INTERACTIVOS
    --------------------------------------------------------- */
    function iniciarEjercicios() {
        var ejercicios = $$('.ejercicio');
        if (!ejercicios.length) { return; }
        var contador = $('#aciertos');
        var total = $('#total-ejercicios');
        var barra = $('#barra-progreso');
        if (total) { total.textContent = ejercicios.length; }

        function actualizarProgreso() {
            var ok = $$('.ejercicio.resuelto').length;
            if (contador) { contador.textContent = ok; }
            if (barra) { barra.style.width = (ok / ejercicios.length * 100) + '%'; }
        }

        ejercicios.forEach(function (ej) {
            var form = $('form', ej);
            var input = $('input', ej);
            var fb = $('.feedback', ej);
            var respuesta = parseFloat(ej.getAttribute('data-respuesta'));
            var tipo = ej.getAttribute('data-tipo');

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var valor = parseFloat(input.value.replace(',', '.'));
                fb.className = 'feedback';
                if (isNaN(valor)) {
                    fb.textContent = 'Escribe un número para verificar.';
                    fb.classList.add('error');
                    return;
                }
                if (Math.abs(valor - respuesta) < 1e-9) {
                    fb.textContent = '✔ ¡Correcto!';
                    fb.classList.add('ok');
                    ej.classList.add('resuelto');
                } else {
                    var pista = tipo === 'inversa'
                        ? 'Pista: es inversa, usa x = (a × b) / c.'
                        : 'Pista: es directa, usa x = (b × c) / a.';
                    fb.textContent = '✘ Todavía no. ' + pista;
                    fb.classList.add('error');
                    ej.classList.remove('resuelto');
                }
                actualizarProgreso();
            });
        });

        var reiniciar = $('#reiniciar');
        if (reiniciar) {
            reiniciar.addEventListener('click', function () {
                ejercicios.forEach(function (ej) {
                    ej.classList.remove('resuelto');
                    $('input', ej).value = '';
                    $('.feedback', ej).textContent = '';
                    $('.feedback', ej).className = 'feedback';
                    var det = $('details', ej);
                    if (det) { det.open = false; }
                });
                actualizarProgreso();
            });
        }
        actualizarProgreso();
    }

    /* ---------------------------------------------------------
       5. EXAMEN "PON A PRUEBA TUS RESULTADOS"
          Cada .pregunta lleva data-correcta="a|b|c|d|e"
    --------------------------------------------------------- */
    function iniciarExamen() {
        var form = $('#examen');
        if (!form) { return; }
        var preguntas = $$('.pregunta', form);
        var total = preguntas.length;
        var respondidas = $('#respondidas');
        var barra = $('#barra-examen');
        var caja = $('#resultado');
        var calificado = false;

        function contar() {
            var n = preguntas.filter(function (p) { return $('input:checked', p); }).length;
            if (respondidas) { respondidas.textContent = n; }
            if (barra) { barra.style.width = (n / total * 100) + '%'; }
            return n;
        }

        form.addEventListener('change', function () { if (!calificado) { contar(); } });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (calificado) { return; }
            var sinResponder = total - contar();
            if (sinResponder > 0 &&
                !window.confirm('Te faltan ' + sinResponder + ' pregunta(s) por responder. ¿Calificar de todos modos?')) {
                return;
            }

            var puntos = 0;
            var repasar = [];
            preguntas.forEach(function (p, i) {
                var elegida = $('input:checked', p);
                var correcta = p.getAttribute('data-correcta');
                p.classList.add('calificada');
                $$('label', p).forEach(function (lb) {
                    var v = $('input', lb).value;
                    if (v === correcta) { lb.classList.add('correcta'); }
                    else if (elegida && v === elegida.value) { lb.classList.add('incorrecta'); }
                    $('input', lb).disabled = true;
                });
                if (elegida && elegida.value === correcta) {
                    puntos++;
                    p.classList.add('ok');
                } else {
                    p.classList.add(elegida ? 'mal' : 'vacia');
                    repasar.push(i + 1);
                }
            });
            calificado = true;

            var mensaje;
            if (puntos >= 18) { mensaje = '¡Excelente! Dominas la regla de tres.'; }
            else if (puntos >= 14) { mensaje = '¡Muy bien! Estás casi listo.'; }
            else if (puntos >= 11) { mensaje = 'Aprobado. Repasa las preguntas falladas para mejorar.'; }
            else { mensaje = 'Sigue practicando: revisa los ejemplos y vuelve a intentarlo.'; }

            $('#puntaje').textContent = puntos;
            $('#mensaje-resultado').textContent = mensaje;
            $('#repasar').textContent = repasar.length
                ? 'Repasa las preguntas: ' + repasar.join(', ') + '.'
                : '¡Respondiste todo correctamente!';
            caja.classList.add('visible');
            $('#calificar').disabled = true;
            caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        $('#reiniciar-examen').addEventListener('click', function () {
            preguntas.forEach(function (p) {
                p.classList.remove('calificada', 'ok', 'mal', 'vacia');
                $$('label', p).forEach(function (lb) {
                    lb.classList.remove('correcta', 'incorrecta');
                    $('input', lb).checked = false;
                    $('input', lb).disabled = false;
                });
            });
            calificado = false;
            caja.classList.remove('visible');
            $('#calificar').disabled = false;
            contar();
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        contar();
    }

    document.addEventListener('DOMContentLoaded', function () {
        iniciarPaneles();
        iniciarFormularios();
        iniciarVideos();
        iniciarEjercicios();
        iniciarExamen();
    });
})();
