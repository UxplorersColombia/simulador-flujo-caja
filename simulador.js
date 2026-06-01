/* ════════════════════════════════════════════════════════════════════
   Simulador de Flujo de Caja · Skandia · lógica
   ════════════════════════════════════════════════════════════════════ */

// ─── Tweakable defaults ─────────────────────────────────────────────
window.SIM_DEFAULTS = /*EDITMODE-BEGIN*/{
  "channel": "cliente",
  "perfilDemo": "auto",
  "clientName": "Usuario",
  "salarioPrecargado": 4500000
}/*EDITMODE-END*/;

// ─── Estado del simulador ────────────────────────────────────────────
const state = {
  channel: window.SIM_DEFAULTS.channel,
  perfilDemo: window.SIM_DEFAULTS.perfilDemo,
  clientName: window.SIM_DEFAULTS.clientName,
  salarioPrecargado: window.SIM_DEFAULTS.salarioPrecargado,
  salario: 0,
  vitales: 30,
  deudas: 20,
  gustos: 15,
  cotidianos: 10,
  futuro: 10
};

// ─── Categorías (orden fijo del brief) ──────────────────────────────
const CATEGORIAS = [
  {
    key: 'vitales',
    title: 'Gastos vitales',
    sublabel: 'Lo que pagas sí o sí cada mes',
    tooltip: 'Arriendo o cuota de vivienda, transporte, servicios públicos, salud y seguros. Lo que no puedes dejar de pagar.',
    color: 'var(--c-vitales)'
  },
  {
    key: 'deudas',
    title: 'Deudas',
    sublabel: 'Lo que le debes al banco o a un crédito',
    tooltip: 'Cuota mínima de tarjetas de crédito, créditos de consumo, libranzas. Si tienes varios, suma todas las cuotas mensuales.',
    color: 'var(--c-deudas)'
  },
  {
    key: 'gustos',
    title: 'Gustos',
    sublabel: 'Lo que disfrutas y eliges gastar',
    tooltip: 'Salidas, restaurantes, ropa, entretenimiento, suscripciones digitales. Lo que gastas porque quieres, no porque toca.',
    color: 'var(--c-gustos)'
  },
  {
    key: 'cotidianos',
    title: 'Gastos pequeños cotidianos',
    sublabel: 'Lo que se te va sin darte cuenta',
    tooltip: 'Cafés, snacks, domicilios pequeños, compras de impulso. Si no sabes cuánto es, multiplica lo que gastas en una semana por 4.',
    color: 'var(--c-cotidianos)'
  },
  {
    key: 'futuro',
    title: 'Futuro',
    sublabel: 'Lo que guardas para ti',
    tooltip: 'Ahorro programado, fondos de inversión, fondo de emergencia. Plata que separas cada mes y no tocas. Es diferente a un gasto — es tuyo.',
    color: 'var(--c-futuro)'
  }
];

// ─── Formato ────────────────────────────────────────────────────────
const formatCOP = (n) => {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? '−' : '') + '$ ' + abs.toLocaleString('es-CO');
};

// ─── Navegación entre pantallas ─────────────────────────────────────
function ir(id) {
  // Guardar historial de navegación
  if (!window._navHistory) window._navHistory = ['s-entrada'];
  if (window._navHistory[window._navHistory.length - 1] !== id) {
    window._navHistory.push(id);
  }
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('screen--active'));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('screen--active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (id === 's-distribucion') updateDistribucion();
  if (id === 's-diagnostico') renderDiagnostico();
  refreshIcons();
}
window.ir = ir;

function irAtras() {
  if (!window._navHistory) window._navHistory = ['s-entrada'];
  if (window._navHistory.length > 1) {
    window._navHistory.pop();
    const prev = window._navHistory[window._navHistory.length - 1];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('screen--active'));
    const target = document.getElementById(prev);
    if (!target) return;
    target.classList.add('screen--active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (prev === 's-distribucion') updateDistribucion();
    if (prev === 's-diagnostico') renderDiagnostico();
    refreshIcons();
  }
}
window.irAtras = irAtras;

// ─── Tooltips ───────────────────────────────────────────────────────
function toggleTip(btn) {
  const id = btn.getAttribute('data-tip-for') || btn.nextElementSibling?.id;
  const box = id ? document.getElementById(id) : btn.nextElementSibling;
  if (!box) return;
  const isOpen = box.classList.contains('visible');
  document.querySelectorAll('.tip-pop.visible').forEach(b => b.classList.remove('visible'));
  if (!isOpen) box.classList.add('visible');
}
window.toggleTip = toggleTip;

document.addEventListener('click', (e) => {
  if (!e.target.closest('.tip-trigger') && !e.target.closest('.tip-pop')) {
    document.querySelectorAll('.tip-pop.visible').forEach(b => b.classList.remove('visible'));
  }
});

// ─── Refresh Lucide icons (idempotente) ─────────────────────────────
function refreshIcons() {
  if (window.lucide && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ─── Canal: ajusta chrome + Pantalla 1 ──────────────────────────────
function setCanal(canal) {
  state.channel = canal;
  document.body.setAttribute('data-channel', canal);

  // Update channel switch active state
  document.querySelectorAll('.channel-switch__btn').forEach(b => {
    b.classList.toggle('channel-switch__btn--active', b.dataset.canal === canal);
  });

  // Update Pantalla 1 contenido por canal
  const label = document.getElementById('salario-label');
  const tip = document.getElementById('salario-tip');
  const helper = document.getElementById('salario-helper');
  const input = document.getElementById('inp-salario');

  if (canal === 'cliente') {
    label.textContent = 'Tu salario mensual estimado';
    tip.textContent = 'Este es el dato que tenemos en tu perfil. Si cambió, puedes ajustarlo aquí.';
    helper.textContent = 'Lo trajimos de tu perfil Skandia. Si tu situación cambió, ajústalo libremente.';
    // Precargar salario
    state.salario = state.salarioPrecargado;
    input.value = state.salario.toLocaleString('es-CO');
    updateSalarioUI();
  } else {
    label.textContent = '¿Cuánto entra a tu cuenta cada mes?';
    tip.textContent = 'Tu sueldo neto mensual, o el promedio de los últimos 3 meses si tu ingreso varía.';
    helper.textContent = 'Tu sueldo neto mensual, o el promedio de los últimos 3 meses si tu ingreso varía.';
    // Limpiar
    state.salario = 0;
    input.value = '';
    updateSalarioUI();
  }

  // Update banner name
  document.getElementById('cliente-banner-name').textContent = 'Hola, ' + state.clientName.split(' ')[0];

  // Update header user (sidebar topbar shows first name only)
  const firstName = state.clientName.split(' ')[0];
  document.getElementById('chrome-user-name').textContent = firstName;
  document.getElementById('chrome-avatar').textContent = state.clientName
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  refreshIcons();
}
window.setCanal = setCanal;

// ─── Pantalla 1: input salario ──────────────────────────────────────
function onSalarioInput(input) {
  const raw = input.value.replace(/\D/g, '');
  const num = parseInt(raw, 10) || 0;
  state.salario = num;
  input.value = num > 0 ? num.toLocaleString('es-CO') : '';
  updateSalarioUI();
}
window.onSalarioInput = onSalarioInput;

function updateSalarioUI() {
  const valorEl = document.getElementById('salario-valor');
  const btn = document.getElementById('btn-continuar');
  if (state.salario > 0) {
    valorEl.textContent = formatCOP(state.salario) + ' al mes';
    btn.disabled = false;
  } else {
    valorEl.textContent = '';
    btn.disabled = true;
  }
}

// ─── Pantalla 2: build sliders ──────────────────────────────────────
// Modo global de entrada para todos los gastos
state.mode = 'slider'; // 'slider' | 'input'

function buildSliders() {
  const list = document.getElementById('sliders-list');
  list.innerHTML = CATEGORIAS.map(cat => `
    <div class="slider-row" data-key="${cat.key}" style="--c:${cat.color}">
      <div class="slider-row__head">
        <div class="slider-row__meta">
          <div class="slider-row__label-wrap">
            <span class="slider-row__label">${cat.title}</span>
            <button type="button" class="tip-trigger" aria-label="Ver explicación de ${cat.title}"
                    data-tip-for="tip-${cat.key}" onclick="toggleTip(this)">
              <i data-lucide="help-circle"></i>
            </button>
            <span class="tip-pop" role="tooltip" id="tip-${cat.key}">${cat.tooltip}</span>
          </div>
          <p class="slider-row__sublabel">${cat.sublabel}</p>
        </div>
        <div class="slider-row__values">
          <span class="slider-row__pct" id="pct-${cat.key}">${state[cat.key]}%</span>
          <span class="slider-row__cop" id="cop-${cat.key}"></span>
        </div>
      </div>

      <!-- Slider track -->
      <div class="slider-row__track" data-show-when="slider">
        <input
          type="range"
          class="slider"
          id="sl-${cat.key}"
          min="0" max="80" value="${state[cat.key]}" step="1"
          oninput="onSlider('${cat.key}', this.value)"
          aria-label="${cat.title}"
          aria-valuetext="${state[cat.key]}%"
        >
      </div>

      <!-- Monto exacto -->
      <div class="amount-input" data-show-when="input" hidden>
        <span class="amount-input__prefix">$</span>
        <input
          type="text"
          inputmode="numeric"
          class="amount-input__field"
          id="amt-${cat.key}"
          placeholder="0"
          autocomplete="off"
          oninput="onAmountInput('${cat.key}', this)"
          aria-label="Monto mensual de ${cat.title} en pesos"
        >
        <span class="amount-input__suffix">al mes</span>
      </div>
    </div>
  `).join('');
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.slider-row').forEach(row => {
    row.dataset.mode = mode;
    row.querySelector('[data-show-when="slider"]').hidden = (mode !== 'slider');
    row.querySelector('[data-show-when="input"]').hidden = (mode !== 'input');
    const key = row.dataset.key;
    if (mode === 'input') {
      const input = row.querySelector('.amount-input__field');
      const cop = state.salario > 0 ? Math.round(state[key] / 100 * state.salario) : 0;
      input.value = cop > 0 ? cop.toLocaleString('es-CO') : '';
    } else {
      const sl = row.querySelector('input[type="range"]');
      if (sl) sl.value = Math.min(state[key], 80);
    }
  });
  // Update toggle buttons
  document.querySelectorAll('.mode-switch__btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('mode-switch__btn--active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  refreshIcons();
}
window.setMode = setMode;

function onAmountInput(key, input) {
  const raw = input.value.replace(/\D/g, '');
  const num = parseInt(raw, 10) || 0;
  input.value = num > 0 ? num.toLocaleString('es-CO') : '';
  if (state.salario > 0) {
    state[key] = Math.min(100, Math.round((num / state.salario) * 100));
  } else {
    state[key] = 0;
  }
  const sl = document.getElementById('sl-' + key);
  if (sl) sl.value = Math.min(state[key], 80);
  updateDistribucion();
}
window.onAmountInput = onAmountInput;

function onSlider(key, val) {
  state[key] = parseInt(val, 10) || 0;
  updateDistribucion();
}
window.onSlider = onSlider;

// ─── Pantalla 2: actualizar visual ──────────────────────────────────
function updateDistribucion() {
  const cats = CATEGORIAS.map(c => c.key);
  const totalGastos = cats.reduce((s, k) => s + state[k], 0);
  const margenPct = Math.max(0, 100 - totalGastos);
  const enRiesgo = totalGastos > 100;

  // Sliders values display + slider track fill + amount input sync
  cats.forEach(k => {
    const pct = state[k];
    const cop = state.salario > 0 ? Math.round(pct / 100 * state.salario) : 0;
    const pctEl = document.getElementById('pct-' + k);
    const copEl = document.getElementById('cop-' + k);
    const sl = document.getElementById('sl-' + k);
    if (pctEl) pctEl.textContent = pct + '%';
    if (copEl) copEl.textContent = state.salario > 0 ? formatCOP(cop) : '';
    if (sl) sl.style.setProperty('--p', ((pct / 80) * 100) + '%');
    // Si está en modo monto y el cambio no viene del propio input, mantén el campo coherente
    const amt = document.getElementById('amt-' + k);
    if (amt && state.mode === 'input' && document.activeElement !== amt) {
      amt.value = cop > 0 ? cop.toLocaleString('es-CO') : '';
    }
  });

  // Barra proporcional
  cats.forEach(k => {
    const seg = document.querySelector(`.distro__seg[data-key="${k}"]`);
    if (seg) seg.style.width = Math.min(state[k], 100) + '%';
  });
  const segMargen = document.querySelector('.distro__seg[data-key="margen"]');
  if (segMargen) segMargen.style.width = (enRiesgo ? 0 : margenPct) + '%';

  // Resumen margen
  const res = document.getElementById('margen-res');
  const icoEl = res.querySelector('.margen-res__icon');
  const label = document.getElementById('margen-label');
  const sub = document.getElementById('margen-sub');
  const pctEl = document.getElementById('margen-pct');
  const copEl = document.getElementById('margen-cop');

  res.classList.remove('margen-res--ok', 'margen-res--ajust', 'margen-res--riesgo');

  if (enRiesgo) {
    res.classList.add('margen-res--riesgo');
    icoEl.innerHTML = '<i data-lucide="alert-triangle"></i>';
    label.textContent = 'Tus gastos superan tus ingresos';
    sub.textContent = 'Mira si puedes ajustar alguna categoría.';
    pctEl.textContent = '+' + (totalGastos - 100) + '%';
    copEl.textContent = '';
  } else if (margenPct < 20) {
    res.classList.add('margen-res--ajust');
    icoEl.innerHTML = '<i data-lucide="info"></i>';
    label.textContent = 'Tu margen libre';
    sub.textContent = 'Es estrecho. Un imprevisto puede afectarte.';
    pctEl.textContent = margenPct + '%';
    copEl.textContent = state.salario > 0 ? formatCOP(Math.round(margenPct / 100 * state.salario)) : '';
  } else {
    res.classList.add('margen-res--ok');
    icoEl.innerHTML = '<i data-lucide="check-circle-2"></i>';
    label.textContent = 'Tu margen libre';
    sub.textContent = 'Lo que queda después de todo lo demás';
    pctEl.textContent = margenPct + '%';
    copEl.textContent = state.salario > 0 ? formatCOP(Math.round(margenPct / 100 * state.salario)) : '';
  }

  refreshIcons();
}

// ─── Pantalla 3: render diagnóstico ─────────────────────────────────
function calcularPerfil() {
  // Permite override desde Tweaks
  if (state.perfilDemo && state.perfilDemo !== 'auto') return state.perfilDemo;

  const egPct = state.vitales + state.deudas + state.gustos + state.cotidianos;
  const margenPct = 100 - egPct - state.futuro;
  if (margenPct < 0) return 'riesgo';
  if (margenPct >= 20) return 'saludable';
  return 'ajustado';
}

const PERFILES = {
  saludable: {
    title: 'Tu flujo está saludable',
    sub: 'Tus ingresos cubren tus gastos con margen positivo.',
    color: 'var(--feedback-success-dark)',
    cssColor: '#16d727',
    tone: 'green',
    icon: 'check-circle-2'
  },
  ajustado: {
    title: 'Tu flujo está ajustado',
    sub: 'Tus ingresos alcanzan, pero el margen es estrecho.',
    color: 'var(--feedback-warning-dark)',
    cssColor: '#ffae08',
    tone: 'yellow',
    icon: 'alert-triangle'
  },
  riesgo: {
    title: 'Tu flujo está en riesgo',
    sub: 'Este mes tus gastos superan tus ingresos.',
    color: 'var(--feedback-error-dark)',
    cssColor: '#e03430',
    tone: 'red',
    icon: 'alert-circle'
  }
};

function renderDiagnostico() {
  const perfil = calcularPerfil();
  const p = PERFILES[perfil];

  const ing = state.salario;
  const egPct = state.vitales + state.deudas + state.gustos + state.cotidianos;
  const margenPct = 100 - egPct - state.futuro;
  const margenPesos = Math.round(margenPct / 100 * ing);
  const futuroPesos = Math.round(state.futuro / 100 * ing);
  const deudaPct = state.deudas;

  // Header del card principal
  document.getElementById('diag-title').textContent = p.title;
  document.getElementById('diag-sub').textContent = p.sub;
  const main = document.getElementById('diag-main');
  main.style.setProperty('--diag-color', p.cssColor);

  // Semáforo dots
  const dots = main.querySelectorAll('.semaforo__dot');
  dots.forEach(d => d.classList.remove('semaforo__dot--on'));
  const onDot = main.querySelector(`.semaforo__dot[data-tone="${p.tone}"]`);
  if (onDot) onDot.classList.add('semaforo__dot--on');

  // Figures
  document.getElementById('diag-margen-valor').textContent = ing > 0 ? formatCOP(margenPesos) : '—';
  document.getElementById('diag-margen-pct').textContent = ing > 0 ? margenPct.toFixed(0) + '%' : '—';

  // Body riesgo: se inyecta dentro de alertas card
  const bodyInline = document.getElementById('diag-body-inline');
  if (perfil === 'riesgo') {
    bodyInline.innerHTML = `<p class="diag-body-note">Eso no significa que estés en una situación sin salida — este es un buen momento para entender qué está pasando con tu plata y tomar acción antes de que el desbalance se acumule.</p>`;
  } else {
    bodyInline.innerHTML = '';
  }

  // Alertas
  const alertas = generarAlertas(perfil, margenPct, margenPesos);
  const list = document.getElementById('alertas-list');
  list.innerHTML = alertas.map(a => `
    <li class="alerta">
      <span class="alerta__icon" style="color:${p.cssColor}">
        <i data-lucide="${p.icon}"></i>
      </span>
      <p class="alerta__text">${a}</p>
    </li>
  `).join('');

  // Proyecciones — carousel (solo verde / amarillo, con futuro > 0)
  const proy = document.getElementById('diag-proyecciones');
  const ctasEl = document.getElementById('diag-ctas');
  const alertasCard = document.getElementById('diag-alertas-card');
  if (perfil !== 'riesgo' && futuroPesos > 0) {
    proy.hidden = false;
    ctasEl.classList.remove('diag-ctas--full-row');
    alertasCard.classList.remove('diag-alertas--full-row');
    document.getElementById('proyecciones-sub').textContent =
      `Con ${formatCOP(futuroPesos)} al mes guardados en Skandia:`;
    state._carouselIdx = 0;
    renderCarousel(futuroPesos);
  } else {
    proy.hidden = true;
    ctasEl.classList.add('diag-ctas--full-row');
    alertasCard.classList.add('diag-alertas--full-row');
  }

  // CTAs
  renderCTAs(perfil);

  refreshIcons();
}

function generarAlertas(perfil, margenPct, margenPesos) {
  const a = [];
  const tasaAhorro = state.futuro;
  const deudaPct = state.deudas;
  const ing = state.salario;
  const egPct = state.vitales + state.deudas + state.gustos + state.cotidianos;

  if (perfil === 'saludable') {
    if (tasaAhorro < 10) {
      a.push(`Tu tasa de ahorro es del <strong>${tasaAhorro}%</strong>. El mínimo que suele funcionar bien es el 10% del ingreso.`);
    } else {
      a.push(`Tu tasa de ahorro es del <strong>${tasaAhorro}%</strong>. Estás por encima del mínimo que suele funcionar bien.`);
    }
    if (deudaPct <= 30) {
      a.push(`Tus deudas representan el <strong>${deudaPct}%</strong> de tus ingresos. Estás dentro de un rango manejable.`);
    }
    a.push(`Tus gastos vitales y deudas juntos toman el <strong>${state.vitales + state.deudas}%</strong> de lo que entra. Queda margen para lo demás.`);
  } else if (perfil === 'ajustado') {
    a.push(`Tu margen libre es del <strong>${margenPct}%</strong>. Con un imprevisto, ese espacio puede achicarse rápido.`);
    if (state.gustos + state.cotidianos > 20) {
      a.push(`Tus gustos y gastos cotidianos representan el <strong>${state.gustos + state.cotidianos}%</strong> de tus ingresos. Ahí puede haber espacio para liberar algo.`);
    }
    a.push('Fortalecer tu fondo de emergencia puede darte más tranquilidad ante lo inesperado.');
  } else {
    if (ing > 0) {
      a.push(`Tus egresos superan tus ingresos en <strong>${formatCOP(Math.abs(margenPesos))}</strong> este mes.`);
    } else {
      a.push('Tus egresos superan tus ingresos este mes.');
    }
    if (deudaPct > 30) {
      a.push(`Tus deudas representan el <strong>${deudaPct}%</strong> de tus ingresos. El rango que suele ser manejable es hasta el 30%.`);
    }
    a.push(`Tus gastos vitales y deudas juntos toman el <strong>${state.vitales + state.deudas}%</strong> de lo que entra. Hay poco espacio para lo demás.`);
  }
  return a;
}


function renderCarousel(futuroPesos) {
  state._futuroPesos = futuroPesos;
  const items = [
    { icon: 'sprout', title: 'Tu primer fondo de inversión', hor: '1 año', monto: futuroPesos * 12, desc: 'Tu plata trabajando para ti en fondos Skandia.', rec: true },
    { icon: 'shield', title: 'Tu fondo de emergencia', hor: '6 meses', monto: futuroPesos * 6, desc: 'Un colchón para imprevistos sin endeudarte.', rec: false },
    { icon: 'plane',  title: 'Tu meta de viaje o proyecto', hor: '2 años', monto: futuroPesos * 24, desc: 'Ahorra para ese sueño que tienes en mente.', rec: false }
  ];
  state._carouselItems = items;
  const idx = state._carouselIdx || 0;
  const track = document.getElementById('proyecciones-list');
  const dots  = document.getElementById('carousel-dots');
  const counter = document.getElementById('carousel-counter');

  track.innerHTML = items.map((it, i) => `
    <div class="carousel__slide${i === idx ? ' carousel__slide--active' : ''}" data-index="${i}">
      <div class="proyeccion${it.rec ? ' proyeccion--rec' : ''}">
        <div class="proyeccion__head">
          <span class="proyeccion__icon"><i data-lucide="${it.icon}"></i></span>
          <span class="proyeccion__hor">${it.hor}</span>
        </div>
        <p class="proyeccion__title">${it.title}</p>
        <div class="proyeccion__value-rec">
          <p class="proyeccion__monto">${formatCOP(it.monto)}</p>
          ${it.rec ? '<span class="proyeccion__badge">Recomendado</span>' : ''}
        </div>
        <p class="proyeccion__desc">${it.desc}</p>
      </div>
    </div>
  `).join('');

  if (dots) dots.innerHTML = items.map((_, i) => `
    <button class="carousel__dot${i === idx ? ' carousel__dot--active' : ''}"
            onclick="goCarousel(${i})" aria-label="Opción ${i + 1}"></button>
  `).join('');

  if (counter) counter.textContent = `${idx + 1} / ${items.length}`;
  refreshIcons();
}

function shiftCarousel(dir) {
  const n = (state._carouselItems || []).length || 3;
  state._carouselIdx = ((state._carouselIdx || 0) + dir + n) % n;
  renderCarousel(state._futuroPesos || 0);
}
window.shiftCarousel = shiftCarousel;

function goCarousel(idx) {
  state._carouselIdx = idx;
  renderCarousel(state._futuroPesos || 0);
}
window.goCarousel = goCarousel;

function renderCTAs(perfil) {
  const el = document.getElementById('diag-ctas');
  if (perfil === 'riesgo') {
    el.innerHTML = `
      <div class="ctas">
        <div class="ctas__head">
          <h3 class="ctas__title">Siguiente paso</h3>
          <p class="ctas__sub">Entender tu situación es el primer paso. Estos recursos pueden ayudarte a dar el siguiente.</p>
        </div>
        <div class="ctas__item">
          <button type="button" class="btn btn--primary btn--full">
            <i data-lucide="book-open"></i>
            Aprender con Skandia
          </button>
          <p class="ctas__note">Encuentra guías y contenidos para entender mejor tu plata y cómo mejorar tu flujo.</p>
        </div>
        <div class="ctas__item">
          <button type="button" class="btn btn--secondary btn--full">
            <i data-lucide="headphones"></i>
            Habla con un asesor
          </button>
          <p class="ctas__note">Un Financial Planner puede acompañarte, sin compromiso.</p>
        </div>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="ctas">
        <div class="ctas__head">
          <h3 class="ctas__title">Siguiente paso</h3>
          <p class="ctas__sub">Convierte ese margen en algo que trabaje por ti.</p>
        </div>
        <div class="ctas__row">
          <button type="button" class="btn btn--primary">
            <i data-lucide="rocket"></i>
            Activa tu futuro con Skandia
          </button>
          <a href="#" class="btn btn--secondary">
            Explorar más opciones
            <i data-lucide="arrow-right"></i>
          </a>
        </div>
      </div>
    `;
  }
}

// ─── Reiniciar ──────────────────────────────────────────────────────
function reiniciar() {
  state.vitales = 30;
  state.deudas = 20;
  state.gustos = 15;
  state.cotidianos = 10;
  state.futuro = 10;

  // Reset modo global a slider
  setMode('slider');

  // Reset sliders DOM
  CATEGORIAS.forEach(c => {
    const sl = document.getElementById('sl-' + c.key);
    if (sl) sl.value = state[c.key];
  });

  // Reset según canal (cliente vuelve a precarga, público vacío)
  setCanal(state.channel);

  updateDistribucion();
  ir('s-entrada');
}
window.reiniciar = reiniciar;

// ─── Tweaks API (para tweaks-app.jsx) ───────────────────────────────
window.applyTweak = function(key, value) {
  if (!(key in state) && key !== 'channel' && key !== 'perfilDemo' && key !== 'clientName' && key !== 'salarioPrecargado') return;
  state[key] = value;
  if (key === 'channel') {
    setCanal(value);
  } else if (key === 'clientName') {
    document.getElementById('chrome-user-name').textContent = value.split(' ')[0];
    document.getElementById('chrome-avatar').textContent = value
      .split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('cliente-banner-name').textContent = 'Hola, ' + value.split(' ')[0];
  } else if (key === 'salarioPrecargado') {
    state.salarioPrecargado = value;
    if (state.channel === 'cliente') {
      state.salario = value;
      const input = document.getElementById('inp-salario');
      if (input) input.value = value.toLocaleString('es-CO');
      updateSalarioUI();
    }
  } else if (key === 'perfilDemo') {
    // si estamos en diagnóstico, re-render
    if (document.getElementById('s-diagnostico').classList.contains('screen--active')) {
      renderDiagnostico();
    }
  }
};

// ─── Carousel swipe (touch) ─────────────────────────────────────────
(function() {
  let startX = 0;
  let isDragging = false;
  document.addEventListener('touchstart', function(e) {
    const track = e.target.closest('.carousel__track');
    if (!track) return;
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) shiftCarousel(1);
      else shiftCarousel(-1);
    }
  }, { passive: true });
})();

// ─── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const canalParam = params.get('canal');
  if (canalParam === 'publico' || canalParam === 'cliente') {
    state.channel = canalParam;
  }
  buildSliders();
  setCanal(state.channel);
  updateDistribucion();
  refreshIcons();
});
