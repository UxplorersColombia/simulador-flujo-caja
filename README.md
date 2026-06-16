# Simulador de Flujo de Caja · Skandia

Herramienta interactiva que en 3 pasos muestra a un usuario en qué se le va la plata cada mes y qué puede hacer para mejorar. Opera en dos canales independientes: **público** (generación de leads) y **cliente** (personalización con datos del perfil Skandia).

---

## Canales

| Canal | Punto de entrada | Diferencias |
|-------|-----------------|-------------|
| **Público** | `cliente/index.html` → `?canal=publico` | Formulario de leads en paso 1, sin sidebar, fondo blanco |
| **Cliente** | `publico/index.html` → `?canal=cliente` | Sidebar + topbar con nombre, salario precargado, sin formulario de leads |

El canal se lee desde el parámetro `?canal=` en la URL. Un script inline al inicio del `<body>` setea `data-channel` antes de renderizar para evitar flash de contenido incorrecto.

---

## Estructura del proyecto

```
simulador-v3/
├── simulador-v3.html     # HTML principal — única fuente de verdad
├── simulador-v3.js       # Toda la lógica: estado, navegación, cálculos, renders
└── simulador-v3.css      # Estilos específicos del v3

simulador.css             # Estilos base del Design System (compartido)
assets/
└── flujo_caja.webp       # Ilustración principal

cliente/index.html        # Redirect → simulador-v3.html?canal=cliente
publico/index.html        # Redirect → simulador-v3.html?canal=publico

CALCULOS.md               # Fórmulas, umbrales, perfiles y variables de estado
PRODUCT.md                # Propósito del producto, usuarios y principios de diseño
```

---

## Cómo correr localmente

El simulador es HTML/CSS/JS puro, sin build step ni dependencias de npm.

```bash
# Con cualquier servidor local, por ejemplo:
npx serve .
# o
python -m http.server 8080
```

Luego abrir:
- `http://localhost:8080/publico/` — canal público
- `http://localhost:8080/cliente/` — canal cliente

> No abrir `simulador-v3.html` directamente con `file://` — el parámetro `?canal=` requiere un servidor HTTP.

---

## Pantallas

| ID | Nombre | Descripción |
|----|--------|-------------|
| `s-entrada` | Tus datos | Bienvenida + formulario de leads (solo canal público) |
| `s-ingresos` | Tus ingresos | Hasta 5 fuentes de ingreso con periodicidad |
| `s-distribucion` | Tu distribución | Sliders por categoría + gastos personalizados |
| `s-diagnostico` | Tu diagnóstico | Resultado, proyecciones y alertas |
| `s-ctas` | Siguiente paso | CTAs personalizados según perfil financiero |

---

## Perfiles financieros

La lógica de diagnóstico clasifica al usuario en uno de tres perfiles según el **margen disponible** (ingresos − gastos totales):

| Perfil | Criterio | Color |
|--------|----------|-------|
| Saludable | Margen ≥ 20% del ingreso | Verde |
| Ajustado | 0% ≤ Margen < 20% | Amarillo |
| En riesgo | Margen < 0% (gasta más de lo que gana) | Rojo |

Ver [CALCULOS.md](CALCULOS.md) para las fórmulas exactas, factores de periodicidad y lógica de alertas.

---

## Configuración por canal

En `simulador-v3.html`, el objeto `window.SIM_DEFAULTS` permite precargar datos del perfil del cliente:

```js
window.SIM_DEFAULTS = {
  nombre: "Usuario",          // Nombre que aparece en topbar y modales
  salario: 5000000,           // Salario mensual precargado (COP)
  asesor: {
    nombre: "Tu asesor",
    correo: "asesor@skandia.com.co",
    celular: "300 000 0000"
  }
}
```

---

## Previews desplegados

| Canal | URL |
|-------|-----|
| Público | https://uxplorerscolombia.github.io/ux-prototypes/projects/prototipo-simulador-tu-plata-publico/v2/ |
| Cliente | https://uxplorerscolombia.github.io/ux-prototypes/projects/prototipo-simulador-tu-plata-cliente/v2/ |
| Documento de cálculos | https://uxplorerscolombia.github.io/ux-prototypes/projects/calculos-simulador-flujo-de-caja/v1/ |

---

## Tecnología

- HTML / CSS / JavaScript vanilla — sin frameworks, sin bundler
- Design System Skandia (`simulador.css` + tokens de `assets/colors_and_type.css`)
- Lucide Icons (CDN)
- Fuentes: Montserrat + Open Sans (Google Fonts)
