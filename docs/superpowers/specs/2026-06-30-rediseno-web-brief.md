# Brief de rediseño — Pets (plataforma de adopción + mascotas perdidas)

Fecha: 2026-06-30
Propósito: documento de handoff para pasarle a "Claude Design" y guiar un
rediseño integral de la web pública. No es un spec de implementación.

## Qué es el producto
Plataforma pública argentina con DOS fines conviviendo en un mismo lugar:
1. **Adopción** — encontrar y publicar mascotas para adoptar.
2. **Perdidos** — reportar y ayudar a reencontrar mascotas perdidas.
Español rioplatense. Stack: Astro 5 + Tailwind 4 (la web pública).
Hay un panel admin aparte (Nuxt) que NO se rediseña acá.

## Arquitectura de información (se mantiene, es buena)
- **Home = hub neutro**: hero corto ("Adoptá. Reportá. Reencontrá.") + dos
  cards grandes que bifurcan a cada mundo + prueba social + footer.
- **Dos mundos separados y color-codeados**, cada uno con su landing completa:
  - `/adopciones` (mundo Adopción)
  - `/perdidos` (mundo Perdidos)
- Nav global minimalista con dos links color-codeados (Adoptar / Perdidos) +
  "Ingresar". El botón de acción (Publicar / Reportar) vive dentro de cada mundo.
- Páginas de detalle `/adopciones/[id]` y `/perdidos/[id]`.

## Estado visual ACTUAL (lo que hay que superar)
- Tipografía: Plus Jakarta Sans (una sola familia).
- Paleta: neutros `slate` + acento `emerald` (adopción) y `orange` (perdidos),
  ambos colores Tailwind por defecto.
- Estilo: badges tipo pill, sombras suaves, mucho blanco, layout centrado.
- Problema honesto: se siente TEMPLATED (default de Tailwind), frío para un
  tema tan emocional, y sin identidad de marca memorable.

## Objetivos del rediseño (todos, en este orden de prioridad)
1. **Identidad propia** — que NO parezca plantilla; sistema visual reconocible.
2. **Calidez / emoción** — es adopción y mascotas perdidas: tiene que emocionar
   y generar confianza, no verse corporativo/frío.
3. **Jerarquía y claridad** — que se lea al instante que hay dos caminos y qué
   hacer en cada uno; guiar la conversión (adoptar / reportar).
4. **Nivel profesional / moderno** — a la altura de un producto real.

## Sistema de dos mundos (clave del diseño)
- Adopción y Perdidos deben SENTIRSE distintos (color, tono, energía) pero
  claramente parte de la misma marca.
- Adopción: cálido, esperanzador, "encontrá tu compañero".
- Perdidos: urgente pero solidario, "ayudá a una familia a reencontrarse"
  (evitar que se sienta alarmista/negativo).
- Coherencia estricta: ningún acento de un mundo aparece en el otro.

## Restricciones
- Español rioplatense en toda la UI.
- Código en JavaScript, nunca TypeScript.
- Tailwind 4 (se pueden definir tokens/tema propios en @theme).
- WCAG: contraste 4.5:1 texto normal / 3:1 texto grande.
- Mobile-first: los dos links del nav siempre visibles; cards del hub se apilan.

## Dirección elegida: "Editorial cálido con carácter" (híbrido A+C)

Referencia visual: `docs/rediseno-web/mockups/AC-hibrido.png`
Estado actual (a superar): `docs/rediseno-web/current-shots/*.png`

Combina la carga emocional de la dirección A con el look and feel expresivo de C:

- **Fotografía protagonista** de mascotas a sangre en las dos cards del hub,
  con overlay de color por mundo (verde en Adopción, terracota en Perdidos).
  El sistema depende de tener buenas fotos propias/de refugios.
- **Tipografía contundente**: display grotesque de mucho carácter para
  titulares (referencia: Bricolage Grotesque), tamaños grandes, titular
  tricolor (ink / verde / terracota). Body en una sans neutra (Inter).
- **Base cálida**: neutros crema/papel en vez de slate frío.
- **Sistema de dos mundos más de marca**: Adopción → verde pino/salvia
  (no emerald puro); Perdidos → terracota/ámbar cálido (no orange puro).
  Coherencia estricta nav → titular → card → botón, sin cruces entre mundos.
- **Detalles**: botones pill oscuros; nav con los dos links color-codeados
  (pills de color = más energía, o texto color-codeado = más sobrio: a definir).

Decisiones finas abiertas para Design:
- Nav con pills de color vs. links de texto color-codeado.
- Titular apilado vs. en una línea.
- Tono exacto y saturación de verde/terracota (definir paleta HSL con ~9 tonos
  por color).

### Otras direcciones exploradas (descartadas, para contexto)

### A. Editorial cálido
- Display serif con carácter para titulares (ej. Fraunces / Spectral) + sans
  humanista para texto. El contraste serif/sans ya rompe el "default Tailwind".
- Neutros cálidos crema/papel en vez de slate frío.
- Fotografía protagonista (caras de mascotas grandes, overlays suaves).
- Paleta por mundo más de marca: Adopción → verde pino/salvia cálido (no emerald
  puro); Perdidos → terracota/ámbar (no orange puro). Mismo hue-family.
- Riesgo: medio (depende de buenas fotos).

### B. Producto moderno y confiable
- Una sans excelente + escala tipográfica fina y mucho aire.
- Profundidad sutil: sistema de ~5 sombras, gradientes suaves por mundo,
  micro-interacciones.
- Color-blocking limpio, bordes casi ausentes (sombra/fondo en lugar de borde).
- Bajo riesgo; menos memorable emocionalmente.

### C. Expresivo / marca fuerte
- Wordmark propio, titulares enormes, motivos ilustrados, formas orgánicas.
- Bloques de color intensos por mundo (casi dos submarcas).
- Alto impacto; riesgo tonal en "Perdidos" (no volverlo festivo).

## Lo que se le pide a Claude Design
- Una dirección visual con: escala tipográfica, paleta HSL con tonos
  predefinidos por mundo, sistema de sombras/elevación, tratamiento de las dos
  cards del hub, y el look & feel del hero de cada mundo.
- Que huya del default de Tailwind: fuentes, color y detalles con intención.
- Decisiones concretas, no genéricas.
