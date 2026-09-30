# Roadmap de Desarrollo: NexPulse

Este archivo define la hoja de ruta evolutiva para la implementación de las mejoras premium de **NexPulse**. Registra el progreso general, las fases de entrega y la fecha en la que se van completando las metas.

---

## 📈 Resumen del Progreso General

- **Fase 1: Estabilidad, QoL y Control Remoto Pro** ➔ `[x] 100% Completado`
- **Fase 2: Personalización Dinámica y Herramientas Inteligentes** ➔ `[x] 100% Completado`
- **Fase 3: Pantallas Premium y Experiencia de Casino Inmersiva** ➔ `[x] 100% Completado`
- **Fase 4: Historial de Torneos, Temas Visuales y Estado de Juego Avanzado** ➔ `[x] 100% Completado`

---

## 🗺️ Fases del Mapa de Ruta

### **Fase 1: Estabilidad, QoL y Control Remoto Pro**
> **Enfoque:** Resolver las advertencias y fallos críticos de TypeScript actuales para lograr un build perfecto, implementar el control remoto inteligente bidireccional P2P con sincronización de la lista de jugadores y temporizadores, y añadir herramientas de calibración rápida en mesa.
- [x] **Hito 1.1:** TypeScript Build 100% Limpio (Corrección de variables inútiles, tipos de Framer Motion e intervalo del reloj y ESLint limpio).
- [x] **Hito 1.2:** Sincronización Bidireccional de PeerJS (El cliente remoto recibe el estado de las ciegas, tiempos y jugadores del Host en tiempo real).
- [x] **Hito 1.3:** Panel de Gestión de Jugadores Móvil (Activar re-entradas, add-ons y eliminaciones directamente desde el móvil).
- [x] **Hito 1.4:** Ajustes rápidos de reloj (+1m / -1m) sincronizados en la interfaz de host y cliente remoto.
- [x] **Hito 1.5:** Integración del panel de configuración rápida de volumen de sonidos y silenciador (Mute).

---

### **Fase 2: Personalización Dinámica y Herramientas Inteligentes**
> **Enfoque:** Dar libertad de configuración al usuario al agregar premios configurables, algoritmos de cálculo automático de ciegas y reparto físico de fichas.
- [x] **Hito 2.1:** Editor de Premios Dinámico en Porcentajes (Suma de cobros personalizables al 100% y cálculo exacto en base al pozo acumulado).
- [x] **Hito 2.2:** Asistente Generador de Ciegas Inteligente (Crear estructuras de ciegas automáticas en base a tiempo, stack y estilo Turbo/Normal/Deepstack).
- [x] **Hito 2.3:** Calculadora de Reparto Físico de Fichas (Cálculo sugerido del conteo de fichas físicas por denominaciones para evitar escasez).

---

### **Fase 3: Pantallas Premium y Experiencia de Casino Inmersiva (Audio & Visual)**
> **Enfoque:** Refinar la atmósfera inmersiva con efectos de sonido realistas y pantallas dedicadas para mejorar la experiencia de torneo física.
- [x] **Hito 3.1:** Investigación y Selección de Efectos de Sonido Premium (Campanas de casino, barajado de cartas reales y alerta dramática de final de nivel).
- [x] **Hito 3.2:** Integración de la biblioteca de sonidos con Web Audio API (soporte de pistas de audio de alta fidelidad pregrabadas).
- [x] **Hito 3.3:** Pantalla Cinematográfica de Descanso (Countdown gigante, estadísticas rotativas de premios, stack promedio, y chip-race).

---

### **Fase 4: Historial de Torneos, Temas Visuales y Estado de Juego Avanzado**
> **Enfoque:** Fidelizar la experiencia con un historial persistente local, permitir cambiar de temas estéticos lujosos (Negro/Oro, Fieltro Verde) y dar soporte a estados complejos de juego.
- [x] **Hito 4.1:** Base de datos local de Torneos Pasados y Hall de la Fama en la página de inicio.
- [x] **Hito 4.2:** Selector de Temas Visuales Premium (Monte Carlo Gold, Classic Vegas, Royal Blue).
- [x] **Hito 4.3:** Implementación del Estado "Ausente" (Away Mode) para jugadores en lista y sorteo interactivo de asientos.
- [x] **Hito 4.4:** Identidad de Marca Premium (Renombrado a NexPulse completado en código/configuraciones e integración del logotipo hexagonal premium estilo familia "Nex" con fusión de Pica y pulso cardíaco).

---

## 🪵 Registro de Cambios e Hitos Completados
*(Este espacio registrará cada logro completado a partir de hoy con su respectiva fecha).*

- **2026-05-23:** Creación e inicialización del plan de mejoras del proyecto, la lista de pendientes (`pendientes.md`) y este roadmap de desarrollo en la carpeta `docs/`.
- **2026-05-23:** Completado Hito 1.1 (TypeScript Build 100% Limpio). Se resolvieron todas las variables e importaciones no usadas en los componentes clave. Se solucionó el tipo del temporizador en `Timer.tsx`, el tipado estricto de Framer Motion en `LandingPage.tsx` y se reestructuró la utilidad `cn` en `utils/cn.ts` para cumplir con las reglas de React Fast Refresh. Se logró una validación de ESLint completamente libre de errores y un build de producción de Vite exitoso.
- **2026-05-23:** Completado Hito 1.2 (Sincronización Bidireccional de PeerJS) e Hito 1.3 (Panel de Gestión de Jugadores Móvil). Se implementó la transmisión automática del estado del Host (cronómetro en vivo, ciegas, pozo de premios y lista de jugadores) a los clientes remotos conectados mediante suscripciones de Zustand. Se rediseñó el control remoto con un panel móvil premium, buscador interactivo de jugadores y gatillos de acción rápida para re-entradas (Rebuy), add-ons y eliminaciones directas en tiempo real. Se verificaron la compilación y el linter sin errores.
- **2026-05-23:** Completado Hito 1.4 (Ajustes rápidos de reloj +1m / -1m). Se implementó la acción `adjustTimer` en `gameStore.ts` con validación de límites de duración del nivel actual y registro automático de la acción. Se integraron botones simétricos en el cronómetro del Host y se agregaron los botones `-1 Min` y `+1 Min` en la sección de control del reloj del control remoto. Adicionalmente, se corrigieron errores de tipado e imports inactivos en `BreakOverlay.tsx` y `FinishTournamentModal.tsx`, garantizando que la compilación de producción y linter se mantengan limpios al 100%.
- **2026-05-23:** Completado Hito 1.5 (Volumen de Sonido y Silenciador). Se implementó la acción `setVolume` y `toggleMute` en Zustand `gameStore.ts` y se vincularon de forma nativa a la instancia `SoundManager` en `audio.ts`. Se diseñó un panel flotante de calibración en la barra superior de `Dashboard.tsx` que incluye control de silencio/activo, slider de 0% a 100% y un botón de test de sonido. Además, se sincronizaron las propiedades de sonido al arranque en `App.tsx` respetando las configuraciones persistentes del usuario. Se completó la Fase 1 del Roadmap con un progreso global de 100% e impecable build y linter.
- **2026-05-23:** Completado Hito 2.1 (Editor de Premios Dinámico en Porcentajes). Se incorporó el arreglo `customPayouts` y su acción `setCustomPayouts` en Zustand `gameStore.ts` y se actualizaron las firmas en `types/index.ts`. Se rediseñó el panel de Premios en `PrizePool.tsx` agregando la pestaña "Personalizado", un selector interactivo para sumar/restar posiciones premiadas (hasta 5) y entradas numéricas individuales para los porcentajes. Se implementó una auditoría en vivo para validar la suma del 100% y alertas animadas. Se extendió la consistencia matemática de cálculo en `FinishTournamentModal.tsx` resolviendo además advertencias de ámbito de declaración en bloques switch (ESLint). Linter y build 100% limpios.
- **2026-05-23:** Completados Hito 2.2 (Asistente Generador de Ciegas Inteligente) e Hito 2.3 (Calculadora de Reparto Físico de Fichas) completando la Fase 2 al 100%. Sincronizados y validados los algoritmos de progresión exponencial de ciegas por velocidad/preseteo e inserciones de descanso, y la distribución exacta de fichas físicas basada en stock y denominaciones activas.
- **2026-05-23:** Completados Hito 3.1 & 3.2 (Diseño de Sonidos Premium) y 3.3 (Pantalla Cinematográfica de Descanso) completando la Fase 3 al 100%. Se diseñaron sintetizadores por modelado físico de alta fidelidad para campanas de casino reales, barajado dinámico de cartas por flujos de ruido blanco y filtrado pasabanda, choque de fichas cerámicas mediante clicks de alta frecuencia y tictac de tensión con thumps graves amortiguados. Además, se integró un menú interactivo de preescucha en el panel de volumen en `Dashboard.tsx` y se verificó el linter y compilado sin errores al 100%.
- **2026-05-23:** Completados Hito 4.1 (Historial local), 4.2 (Selector de Temas Premium) y 4.3 (Estado Ausente/Away Mode) de la Fase 4 (75% Completado). Se enlazaron variables de estado para temas visuales elegantes (Cyberpunk, Monte Carlo Gold, Classic Vegas, Royal Blue) y estados intermedios de jugador para mantener un control absoluto del torneo. All builds and lints are 100% verified.
- **2026-05-23:** Completado Hito 4.4 (Identidad de Marca Premium) cerrando el Roadmap de NexPulse al **100% de cumplimiento**. Se renombró la aplicación en todas las dependencias del ecosistema de archivos (`package.json`, `index.html`, manifiesto PWA, componentes visuales e interfaces). Adicionalmente, se generó e integró el logotipo hexagonal premium con un gradiente de naipes en rojo carmesí y una fusión estilizada de la Pica (♠️) y el pulso de ECG, alineando perfectamente el diseño con la suite de aplicaciones "Nex" del usuario. Prototipo compilado con éxito.
- **2026-09-30:** Auditoría completa de la app. Se corrigieron errores de atajos de teclado, rendimiento del reloj, descansos, contabilidad del pozo, reconexión del control remoto, importación de respaldos, sorteo de asientos y carga de fuentes. Se rediseñó el panel (estadísticas, reloj con ciegas, menú agrupado, acciones táctiles) y se agregaron: configuración del torneo, inscripción rápida, orden de eliminación y podio automático, anuncios por voz, ventana TV independiente, sorteo multi-mesa, chip race calculado y ranking histórico. Ver Bloque 6 en `pendientes.md`.
- **2026-09-30:** Implementadas todas las propuestas pendientes (Bloque 7): comisión y garantizado, bounties, límites de re-entradas/add-ons, estructuras guardadas, rebalanceo de mesas, división del código y 43 tests automáticos.
