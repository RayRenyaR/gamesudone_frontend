# Módulos Externos (`src/modules/`)

Esta carpeta está reservada para alojar los módulos desarrollados por los demás equipos de **gamesUDONE**. El núcleo de la plataforma provee el layout principal, el enrutamiento, el sistema de audio y la hoja de estilos base (`src/styles/PlatformStyles.css`).

## Mapa de Integración por Equipo (Sugerido)

| Carpeta / Destino | Equipo | Tipo de Integración |
| :--- | :--- | :--- |
| `src/modules/chat/` | Equipo Rojo | Embebido dentro de `GeneralChatDrawer` |
| `src/services/recommendationsEngine.ts` | Equipo Naranja | Fuente de datos para recomendados y favoritos |
| `src/modules/avatar/` | Equipo Blanco | Vista/ruta accesible desde la sidebar y `UserSettingsPopover` |
| `src/modules/kaik/` | Equipo Verde | Vista/ruta accesible desde la sidebar |
| `src/modules/forum/` | Equipo Cyan | Vista/ruta accesible desde la sidebar |
| `src/modules/store/` | Tienda / Gacha | Vista/ruta accesible desde la sidebar |

## Qué provee la plataforma

Los módulos no necesitan reimplementar la navegación ni los estilos base. Pueden consumir directamente las variables y clases globales definidas en `PlatformStyles.css`:

* **Variables de superficie y bordes:** `--panel-base`, `--panel-elevated`, `--panel-inset-bg`, `--panel-card-bg`, `--panel-border-outer`
* **Variables de acento y texto:** `--primary-top`, `--primary-mid`, `--primary-bot`, `--accent-gold`, `--text-main`, `--text-soft`, `--text-dim`
* **Tipografías:** `--font-main`, `--font-display`
* **Clases utilitarias listas:** `.tactile-panel`, `.tactile-btn-purple`, `.tactile-btn-dark`

## Reglas de Integración (Cómo no romper la app)

1. **Encapsulamiento:** Todo el código, estilos y assets de un módulo deben vivir dentro de su propia subcarpeta en `src/modules/<modulo>/`.
2. **Aislamiento de CSS:** No definir reglas globales (`html`, `body`, `button`, `input`, `:root`). Prefijar todos los selectores con una clase raíz propia del módulo o utilizar CSS Modules (`*.module.css`).
3. **Dimensiones flexibles:** El contenedor principal del módulo debe adaptarse al espacio asignado (`width: 100%; height: 100%`) sin romper el layout padre.
4. **Scroll controlado:** No usar `element.scrollIntoView()` dentro de paneles o cajones laterales, ya que puede desplazar el viewport global de la aplicación. Usar `container.scrollTop = container.scrollHeight` sobre el contenedor interno.
5. **Dependencias y Props:** Recibir datos globales (como sesión de usuario o URLs de API) mediante `props` en lugar de acoplarse a almacenamiento externo o configuraciones hardcodeadas.
6. Tope de z-index: La sidebar y el chat viven entre 1200 y 1350, y los modales globales en 1500–1700. Los módulos deben mantener sus z-index internos por debajo de 100 (o usar isolation: isolate).
7. Sin librerías invasivas ni routers propios: No envolver su módulo en <BrowserRouter> ni instalar frameworks CSS con resets globales (como Bootstrap o MUI) sin avisar.