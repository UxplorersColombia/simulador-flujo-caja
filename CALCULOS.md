# Lógica de cálculos — Simulador de Flujo de Caja · Skandia

**Versión:** simulador-v3  
**Última actualización:** 2026-06-10  
**Propósito:** Documentar cómo se calculan los diagnósticos, perfiles y alertas para revisión y validación por parte de los stakeholders.

---

## 1. Resumen del modelo

El simulador clasifica la salud financiera mensual de un usuario en tres perfiles: **Saludable**, **Ajustado** y **En riesgo**. La clasificación se basa en una sola variable: el **margen disponible mensual**, expresado como porcentaje del ingreso total.

| Perfil | Color | Criterio |
|---|---|---|
| **Saludable** | Verde | Margen ≥ 20% del ingreso |
| **Ajustado** | Amarillo | 0% ≤ Margen < 20% del ingreso |
| **En riesgo** | Rojo | Margen < 0% (gastos > ingresos) |

---

## 2. Fórmulas exactas

### 2.1 Ingreso mensual total

El usuario ingresa una o varias fuentes de ingreso con periodicidad. Todas se normalizan a mensual:

```
Ingreso mensual = Σ (monto_fuente × factor_periodicidad)
```

**Factores de periodicidad:**

| Periodicidad | Factor |
|---|---|
| Quincenal | × 2 |
| Mensual | × 1 |
| Bimestral | × 0.5 |
| Semestral | × 1/6 ≈ 0.1667 |
| Anual | × 1/12 ≈ 0.0833 |

### 2.2 Porcentaje de cada categoría

Los sliders representan porcentaje del ingreso mensual. El monto en pesos se calcula así:

```
Monto mensual (COP) = (porcentaje / 100) × Ingreso mensual
```

Los sliders permiten hasta el **300% del ingreso** (para reflejar que algunas personas gastan más de lo que ganan, p. ej. personas con créditos o deudas altas).

**Categorías con slider:**
- Gastos vitales (`vitales`)
- Deudas (`deudas`)
- Gustos (`gustos`)
- Gastos cotidianos (`cotidianos`)
- Futuro / Ahorro (`futuro`)

**Gastos personalizados ("Otros"):** Se ingresan en COP. Se convierten a porcentaje para el cálculo:

```
Otros (%) = (Total gastos otros en COP / Ingreso mensual) × 100
```

### 2.3 Margen disponible

```
Margen (%) = 100 - vitales% - deudas% - gustos% - cotidianos% - futuro% - otros%

Margen (COP) = (Margen% / 100) × Ingreso mensual
```

> El margen **excluye el ahorro programado (Futuro)** — es lo que sobra después de todos los gastos Y el ahorro. Esto se aclara en la etiqueta del diagnóstico con el tooltip "Disponible del ingreso".

### 2.4 Clasificación del perfil

```javascript
if (margen < 0)   → perfil = 'riesgo'   // gastos > ingresos
if (margen >= 20) → perfil = 'saludable' // margen holgado
else              → perfil = 'ajustado'  // margen estrecho pero positivo
```

---

## 3. Ejemplo numérico

**Datos del usuario:**
- Ingreso mensual: $5.000.000
- Gastos vitales: 35% → $1.750.000
- Deudas: 15% → $750.000
- Gustos: 10% → $500.000
- Cotidianos: 8% → $400.000
- Futuro (ahorro): 12% → $600.000
- Otros: $0

**Cálculo:**
```
Margen% = 100 - 35 - 15 - 10 - 8 - 12 - 0 = 20%
Margen (COP) = 20% × $5.000.000 = $1.000.000
Perfil = Saludable (margen ≥ 20%)
```

**Ejemplo perfil Ajustado:**
- Mismos datos pero Gastos vitales = 45%, Deudas = 25%
```
Margen% = 100 - 45 - 25 - 10 - 8 - 12 = 0% → Ajustado (0% ≤ margen < 20%)
```

**Ejemplo perfil En riesgo:**
- Gastos vitales = 50%, Deudas = 40%, Gustos = 15%, Cotidianos = 8%, Futuro = 5%
```
Margen% = 100 - 50 - 40 - 15 - 8 - 5 = -18% → En riesgo (margen < 0)
```

---

## 4. Umbrales de alertas

Las alertas se muestran en la pantalla de diagnóstico según el perfil y los valores de cada categoría. Cada umbral tiene su justificación de referencia.

### Perfil Saludable

| Condición | Alerta | Referencia |
|---|---|---|
| `ahorro < 10%` | "Tu tasa de ahorro es del X%. El mínimo que suele funcionar bien es el 10% del ingreso." | Regla general de finanzas personales: ahorro mínimo del 10% mensual |
| `ahorro ≥ 10%` | "Tu tasa de ahorro es del X%. Estás por encima del mínimo recomendado." | Refuerzo positivo |
| `deudas ≤ 30%` | "Tus deudas representan el X% de tus ingresos. Estás dentro de un rango manejable." | Límite de endeudamiento responsable: máx. 30% del ingreso (Banco de la República / reguladores financieros) |
| Siempre | "Tu margen está por encima del 20% — tienes un buen respaldo ante imprevistos." | Fondo de emergencia: margen > 20% se considera holgado |

### Perfil Ajustado

| Condición | Alerta | Referencia |
|---|---|---|
| Siempre | "Tu margen libre es del X%. Ante un imprevisto, ese espacio puede reducirse rápidamente." | — |
| `gustos + cotidianos > 20%` | "Tus gustos y gastos cotidianos representan el X% de tus ingresos. Puede haber espacio para reducirlos y ampliar tu margen." | Regla 50/30/20: máximo 30% en gustos y ocio |
| `ahorro < 10%` | "Tu tasa de ahorro es del X%. Fortalecer ese porcentaje puede darte más tranquilidad." | Mínimo 10% mensual |
| `ahorro ≥ 10%` | "Fortalecer tu fondo de emergencia puede darte más tranquilidad ante lo inesperado." | Fondo de emergencia de 3-6 meses de gastos |

### Perfil En riesgo

| Condición | Alerta | Referencia |
|---|---|---|
| Siempre | "Tus gastos superan tus ingresos en $X este mes." | — |
| `deudas > 30%` | "Tus deudas representan el X% de tus ingresos." | Umbral de sobreendeudamiento: >30% del ingreso (DANE, reguladores financieros) |
| `vitales > 50%` | "Tus gastos vitales toman el X% de lo que entra." | Regla 50/30/20: vitales no deben superar el 50% del ingreso |
| `vitales ≤ 50%` | "Tus gastos vitales y deudas juntos toman el X% de lo que entra." | Referencia combinada |

---

## 5. Regla 50/30/20 (referencia base)

El modelo usa la **regla 50/30/20** como referencia orientativa:

| Categoría | Porcentaje recomendado |
|---|---|
| Gastos esenciales / vitales | Hasta el 50% |
| Gustos / ocio | Hasta el 30% |
| Ahorro / futuro | Al menos el 20% |

> **Nota:** Esta regla es orientativa, no normativa. El simulador no obliga al usuario a seguirla; simplemente la usa como referencia para contextualizar los diagnósticos y alertas.

---

## 6. Variables de entrada y estado

| Variable | Tipo | Descripción |
|---|---|---|
| `state.salario` | Número (COP) | Ingreso mensual total calculado desde las fuentes |
| `state.fuentes` | Array | Lista de fuentes de ingreso: `{id, monto, periodicidad}` |
| `state.vitales` | Número (%) | % del ingreso destinado a gastos vitales |
| `state.deudas` | Número (%) | % del ingreso destinado a deudas y compromisos |
| `state.gustos` | Número (%) | % del ingreso en gustos y ocio |
| `state.cotidianos` | Número (%) | % del ingreso en gastos cotidianos pequeños |
| `state.futuro` | Número (%) | % del ingreso destinado al ahorro/inversión |
| `state.otros` | Array | Gastos personalizados: `{id, nombre, montoMensual (COP)}` |
| `state.vitalesDetalle` | Array | Subcategorías de Vitales: `{key, label, monto (COP/mes)}` |
| `state.deudasDetalle` | Array | Subcategorías de Deudas: `{key, label, monto (COP/mes)}` |
| `state.periodicidades` | Objeto | Periodicidad seleccionada por categoría |
| `state.lead` | Objeto | Datos del formulario público: nombre, email, teléfono |
| `state.channel` | String | `'publico'` o `'cliente'` |

---

## 7. Tratamiento de periodicidades

Los montos ingresados en periodicidad no mensual se normalizan a mensual antes de cualquier cálculo:

```
Monto mensual = Monto ingresado × PERIODICIDAD_FACTOR[periodicidad]
```

| Periodicidad | Factor de conversión a mensual |
|---|---|
| Quincenal | ×2 (dos quincenas = un mes) |
| Mensual | ×1 |
| Bimestral | ×0.5 (un bimestre = dos meses) |
| Semestral | ×1/6 |
| Anual | ×1/12 |

**Ejemplo:** Si el arriendo es $1.500.000 mensual y el usuario lo ingresa como quincenal ($750.000), el cálculo lo convierte: 750.000 × 2 = $1.500.000/mes ✓

---

## 8. Subcategorías opcionales (Vitales y Deudas)

El usuario puede desglosar cada rubro en subcategorías. Cuando lo hace, la suma de las subcategorías **reemplaza** el valor del slider principal en el cálculo.

```
Si state.vitalesDetalle.length > 0:
  Monto vitales = Σ (detalle.monto para cada detalle en vitalesDetalle)
  state.vitales = round(Monto vitales / salario × 100)
```

Las subcategorías siempre se ingresan en COP mensual.

---

## 9. Casos límite

| Caso | Comportamiento |
|---|---|
| **Salario = 0** | Los porcentajes no se calculan. Los displays muestran "—". |
| **Margen muy negativo (< -100%)** | `calcularPerfil()` retorna `'riesgo'`. No hay límite inferior para el margen. |
| **Suma de subcategorías > monto original del slider** | El slider se actualiza automáticamente al nuevo porcentaje (puede superar el valor anterior). |
| **Gastos totales > 300% del ingreso** | El slider se topa en 300%. Los montos en COP pueden seguir siendo más altos si el usuario los ingresa manualmente. |
| **Una fuente de ingreso en cero** | Se ignora en el cálculo del total. |
| **Sin fuentes de ingreso registradas** | El botón "Continuar" en s-ingresos permanece deshabilitado. |

---

## 10. Proyecciones (pantalla de diagnóstico)

Las proyecciones solo se muestran para perfiles **Saludable** y **Ajustado** cuando `state.futuro > 0`.

| Proyección | Horizonte | Cálculo |
|---|---|---|
| Fondo de inversión | 1 año | `futuroPesos × 12` |
| Fondo de emergencia | 6 meses | `futuroPesos × 6` |
| Meta de proyecto / viaje | 2 años | `futuroPesos × 24` |

> **Nota:** Las proyecciones son lineales y no incluyen rendimientos ni inflación. Son ilustrativas del hábito de ahorro, no proyecciones financieras.
