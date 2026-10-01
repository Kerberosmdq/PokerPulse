# Pendientes: Mejoras y Características de NexPulse

Este archivo registra todas las tareas y mejoras planificadas para el torneo de póker **NexPulse**. Es una lista de control interactiva para guiar el desarrollo paso a paso.

---

## 🛠️ Bloque 1: Estabilidad y Calidad de Código (QoL)

- [x] **1. Limpieza y Corrección de Errores de Compilación TypeScript**
  - [x] Eliminar importaciones y variables declaradas no utilizadas en `App.tsx`, `SeatingDraw.tsx`, `TVMode.tsx`, `RemoteClient.tsx`, `BlindsConfig.tsx` y `ChipsConfig.tsx`.
  - [x] Corregir la firma del intervalo del temporizador de `NodeJS.Timeout` a `any` o tipado seguro de navegador en `Timer.tsx` para solucionar `TS2503`.
  - [x] Corregir la definición y tipado estricto de las variantes de Framer Motion en `LandingPage.tsx` (`TS2322`).
  - [x] Validar que la compilación con `pnpm run build` sea completamente exitosa y sin advertencias.

---

## 📡 Bloque 2: Optimización de Características Existentes

- [x] **2. Sincronización Bidireccional Completa con PeerJS (Control Remoto Total)**
  - [x] Diseñar el envío periódico de estado en `peerService.ts` desde el anfitrión (Host) a todos los clientes conectados.
  - [x] Actualizar el estado del cliente remoto (`RemoteClient.tsx`) con el reloj dinámico, ciegas del nivel actual y ciegas del siguiente nivel.
  - [x] Sincronizar y mostrar la lista de jugadores activos y eliminados en el dispositivo móvil del control remoto.
  - [x] Implementar botones de interacción en el control remoto para activar **Re-entrada (Rebuy)**, **Add-on** y **Eliminación (Bust)** para cada jugador de forma remota.

- [x] **3. Editor Dinámico de Estructura de Premios (Payouts)**
  - [x] Añadir la opción de estructura de premios `"custom"` en `PrizePool.tsx`.
  - [x] Implementar controles interactivos para añadir/eliminar posiciones de cobro.
  - [x] Agregar inputs numéricos para fijar el porcentaje de pozo por posición.
  - [x] Desarrollar una validación en tiempo real para asegurar que la suma de porcentajes de cobro sea exactamente del 100%.

- [x] **4. Botones de Ajuste Rápido del Temporizador (+1m / -1m)**
  - [x] Agregar botones visuales elegantes de `+1m` y `-1m` en el Dashboard al lado del reloj.
  - [x] Sincronizar estos botones en el panel del control remoto móvil (`RemoteClient.tsx`).
  - [x] Implementar la lógica en Zustand (`gameStore.ts`) para añadir o restar 60 segundos de forma segura sin sobrepasar el límite de duración del nivel.

- [x] **5. Menú de Configuración de Audio y Silenciador (Mute)**
  - [x] Añadir un botón flotante o menú rápido de altavoz en la barra superior.
  - [x] Conectar la propiedad de volumen maestro de `SoundManager` a un control deslizante (slider) interactivo.
  - [x] Implementar la función de silenciar/activar volumen global en `useGameStore`.

---

## 🚀 Bloque 3: Ideas de Características Nuevas

- [x] **6. Algoritmo Generador Inteligente de Ciegas**
  - [x] Añadir el tab/opción "Generar Estructura" en la configuración de ciegas (`BlindsConfig.tsx`).
  - [x] Crear campos para ingresar: Duración deseada, Jugadores estimados y Stack inicial.
  - [x] Implementar presets de velocidad: **Turbo**, **Normal** y **DeepStack**.
  - [x] Codificar el algoritmo matemático de progresión de ciegas (ajustando antes y niveles de descanso automáticos).

- [x] **7. Calculadora de Reparto de Fichas Iniciales (Stack Calculator)**
  - [x] Desarrollar una pantalla interactiva en `ChipsConfig.tsx` que analice la suma de fichas necesarias para completar el stack inicial.
  - [x] Mostrar en base a las denominaciones habilitadas (ej. 25, 100, 500, 1000) el conteo exacto de fichas físicas que debe recibir cada jugador.
  - [x] Añadir advertencias visuales si la cantidad total de fichas físicas excede el stock promedio de un maletín de póker estándar.

- [x] **8. Pantalla Dinámica de Descanso Completa (Break Overlay)**
  - [x] Crear un componente a pantalla completa para el estado de descanso en el torneo.
  - [x] Mostrar una cuenta regresiva gigante con alertas visuales de tiempo.
  - [x] Añadir información útil rotativa en pantalla: pozo total, cobros del top 3, stack promedio de fichas y recordatorios de cambio de fichas chicas ("chip race").

- [x] **9. Historial y Analytics de Torneos Pasados**
  - [x] Configurar un almacenamiento secundario persistente (`poker-pulse-history`) para registrar torneos finalizados.
  - [x] Al presionar "Finalizar", guardar: Fecha, Pozo total, cantidad de rebuys/addons, y nombres de los ganadores (Top 3).
  - [x] Crear una sección de "Historial" en la página de Landing para consultar estadísticas previas y logros de los jugadores locales.

- [x] **10. Personalizador de Temas Estéticos Premium**
  - [x] Añadir variables dinámicas de color en `index.css` asociadas a temas seleccionables.
  - [x] Diseñar el selector visual de temas en la barra superior del Dashboard.
  - [x] Crear las paletas de color y estilos para:
    - `Default Cyberpunk` (Verde y Azul Neón)
    - `Monte Carlo Gold` (Negro y Oro)
    - `Classic Vegas` (Fieltro Verde y Terciopelo Rojo)
    - `Royal Blue` (Azul y Plata)

- [x] **11. Estado Intermedio del Jugador: "Ausente" (Away Mode)**
  - [x] Extender el tipo de estado de jugador (`PlayerStatus`) para soportar `'away'`.
  - [x] Implementar un botón "Ausente" en la fila del jugador en el Dashboard y en el control remoto.
  - [x] Diseñar el indicador visual amarillo en la lista de jugadores y en el sorteo interactivo de asientos para destacar al jugador ausente.

---

## 🔊 Bloque 4: Calidad y Efectos de Sonido (Adicional)

- [x] **12. Búsqueda y Diseño de Mejores Efectos de Sonido Premium**
  - [x] **Investigación de Audio Assets:** Seleccionar efectos de audio realistas o electrónicos de alta calidad y libres de derechos (sonido de barajeo de cartas, caída de fichas al subir de nivel, alarma tensa para últimos 10 segundos).
  - [x] **Refactorización de `audio.ts`:**
    - [x] Permitir la reproducción de archivos de audio reales precargados (utilizando Web Audio API `AudioBufferSourceNode`) para lograr la máxima fidelidad.
    - [x] Si se usan osciladores generados por código, diseñar tonos polifónicos complejos con modulación de frecuencia avanzada (FM) y cascada de armónicos para emular timbres de campanas profesionales de casino.
  - [x] **Preescucha interactiva:** Añadir botones en el panel de configuración de sonido para probar y cambiar entre diferentes sets de sonidos disponibles.

---

## 🎨 Bloque 5: Identidad de Marca y Logo (Nuevo)

- [x] **13. Renovación de la Identidad Visual y Marca**
  - [x] **Cambiar nombre de la aplicación:** Evaluar y modificar el nombre comercial de la aplicación en el código (`package.json`), títulos HTML (`index.html`), manifiesto PWA (`manifest.webmanifest`), y componentes para una identidad más personalizada y exclusiva.
  - [x] **Ver nuevo diseño de logo:** Crear y previsualizar una propuesta de logotipo premium en la pantalla de carga (Landing Page), en la barra superior del Dashboard, en el menú móvil y como favicon de la app.

---

## 🔍 Bloque 6: Auditoría General, Correcciones y Rediseño UX/UI (2026-09-30)

- [x] **14. Correcciones de errores**
  - [x] Los atajos de teclado (Espacio, flechas) ya no se disparan mientras se escribe en un campo.
  - [x] El reloj solo notifica al cambiar el segundo (antes: 10 re-renders, 10 escrituras en localStorage y 10 envíos al remoto por segundo).
  - [x] Avance de nivel sin deriva: arrastra el tiempo real transcurrido si la pestaña estuvo suspendida.
  - [x] Los descansos corren solos (antes quedaban en pausa y la cuenta no avanzaba).
  - [x] Borrar un jugador descuenta también sus re-entradas y add-ons del pozo; los eliminados muestran el gasto real.
  - [x] Re-entrada disponible para jugadores eliminados desde el panel.
  - [x] Reconexión del control remoto (el chequeo usaba estado viejo y nunca reconectaba).
  - [x] Importar respaldo: validación del archivo y restauración real del estado.
  - [x] Sorteo de asientos: mezcla sin sesgo (Fisher–Yates) y soporte para más de 9 jugadores.
  - [x] Modo TV mostraba "0 / 0" durante los descansos.
  - [x] Campos numéricos que clampeaban en cada tecla (imposible escribir "120").
  - [x] Fuentes Inter/JetBrains Mono nunca se cargaban; textura de ruido externa devolvía 402.
  - [x] Logo con fondo blanco (era un JPEG); ahora SVG transparente + íconos PWA reales.
  - [x] Manifest PWA con orientación horizontal forzada (rompía el remoto en el celular).

- [x] **15. Mejoras de UX/UI**
  - [x] Temas aplicados a toda la app (colores del reloj, brillos y fondos ya no quedan en verde fijo).
  - [x] Reloj con ciegas actuales, próximo nivel, próximo descanso y alerta visual en el último minuto.
  - [x] Barra de estadísticas: pozo, jugadores en juego, stack promedio (en BB), re-entradas y tiempo jugado.
  - [x] Barra superior reorganizada: acciones principales visibles y el resto en un menú.
  - [x] Acciones de jugador siempre visibles (antes solo con hover: invisibles en tablet/celular).
  - [x] "Deshacer" tras eliminar a un jugador; confirmación antes de borrar.
  - [x] Modales accesibles (Esc, foco atrapado) y avisos (toasts) en lugar de alert()/confirm().

- [x] **16. Funciones nuevas**
  - [x] Paso "Torneo" en el asistente: nombre, entrada, stack, re-entrada y add-on, reparto de premios.
  - [x] Paso "Jugadores" con inscripción rápida y jugadores habituales.
  - [x] Orden de eliminación y podio sugerido automáticamente al finalizar; aviso de campeón.
  - [x] Anuncios por voz de subida de ciegas, descansos y último minuto.
  - [x] Pantalla TV en ventana aparte (segundo monitor/TV), sincronizada sin escribir datos.
  - [x] Sorteo multi-mesa equilibrado, guardado en cada jugador y copiable.
  - [x] Chip race calculado según las fichas y ciegas reales.
  - [x] Ranking histórico de jugadores (títulos, cobros, ganancias) y "copiar resultados".
  - [x] ID de anfitrión estable: los celulares se reconectan solos tras recargar.

## ✅ Bloque 7: Propuestas implementadas (2026-09-30, rama `feature/propuestas-pendientes`)

- [x] **17. Comisión de la casa y pozo garantizado.** Porcentaje sobre el pozo (sin bounties) y garantizado que completa la casa; desglose visible en Premios.
- [x] **18. Bounties.** Parte de cada entrada/re-entrada va a la cabeza del jugador; al eliminar se elige quién lo sacó (también desde el celular), con deshacer. Al finalizar, lo no cobrado va al campeón. Se guardan en el historial y suman al ranking.
- [x] **19. Límites de re-entradas y add-ons.** Hasta qué nivel (incluye el descanso siguiente) y máximo por jugador. Los botones se deshabilitan mostrando el motivo, y el anfitrión rechaza pedidos del remoto que no cumplan.
- [x] **20. Estructuras de ciegas guardadas.** Guardar con nombre, cargar y borrar desde el paso Ciegas.
- [x] **21. Rebalanceo de mesas.** Aviso con los cambios sugeridos cuando las mesas quedan desparejas o sobra una; propone sortear la mesa final.
- [x] **22. División del código.** Cada pantalla y modal se descarga al usarse; PeerJS solo con el control remoto. Carga inicial: de ~600 KB a ~360 KB.
- [x] **23. Tests automáticos.** Vitest con 43 pruebas: reloj, pozo, bounties, reglas, premios, mesas y plantillas (`pnpm test`).


---

## 🃏 Bloque 8: Asistente de manos para jugadores (en curso, rama `feature/asistente-manos`)

**Objetivo:** que cada jugador, desde su celular, pueda consultar qué hacer antes del flop según su posición y sus cartas, en menos de 5 segundos y sin demorar la mesa. Todo con reglas (sin IA), explicado en castellano.

**Decisiones tomadas:**
- Cada jugador arma su mesa cuando consulta: cantidad de jugadores, su asiento y el dealer (se recuerdan entre usos; "D ➜" corre el dealer un lugar).
- Versión 1: solo antes del flop.
- Notas de rivales: privadas en cada celular, nunca se comparten.
- Uso libre durante el torneo: todos tienen el mismo acceso.

**Etapas:**
- [x] **24. Cerebro de rangos.** 169 manos, posiciones según cantidad de jugadores (2 a 10), rangos por situación (nadie entró, pagaron, subieron, resubieron, all-in) y por stack (40+, 15–40, menos de 15 BB), recomendación con explicación. 32 tests.
- [x] **25. Guía visual.** Cuadrícula 13 × 13 en colores por posición y situación, explicación de cada mano y de las posiciones. Accesible por link, sin torneo.
- [x] **26. Asistente de mano.** Mini-mesa (jugadores, tu asiento, dealer), cartas en 1 toque, situación en 1 toque y respuesta grande con el "¿por qué?".
- [x] **27. QR de jugadores.** Dos QR (organizador / jugadores), vista de jugador con reloj, ciegas y sus fichas en BB, y permisos validados en la computadora.
- [x] **28. Notas privadas de rivales** que ajustan el consejo.
- [ ] **29. Modo práctica.** Juego de preguntas con puntos y rachas para aprender entre manos.

**Fases futuras:**
- [ ] **Después del flop:** qué juego tenés en la mesa (pareja, proyectos de color o escalera), cuántas cartas te sirven ("outs"), probabilidad de ligar y si conviene pagar según el tamaño del pozo.
- [ ] **Que el asistente "aprenda" de las notas:** con cada nota se calculan estadísticas de cada rival (cuánto juega, cuánto sube, cuánto resube, cuánto se tira ante resubidas). Con pocas manos se lo considera promedio y se corrige con más datos, para no etiquetar por una mano rara. Se clasifica el estilo (roca, agresivo, suelto, maníaco) y el consejo se ajusta explicando por qué ("Juan casi nunca sube: tirá AJo"). Todo queda en el celular de cada jugador.
