# Landing Page MCP Server

Este servidor MCP permite construir de forma autónoma landing pages responsivas de alta estética con temas dinámicos (dark, light, glass, neon) y assets integrados.

## Herramientas de Construcción Disponibles

1. `list_assets`: Lista los archivos base del generador (`styles.css`, `layout.html`).
2. `get_asset_content`: Obtiene el contenido de un asset específico.
3. `build_landing_page`: Crea un archivo HTML completamente autocontenido con estilos y copy inyectados en la ruta especificada.

## Integración en Clientes de IA

### 1. Cursor
Añade en **Settings > Models > MCP**:
- **Name**: `landing-page-mcp`
- **Type**: `stdio`
- **Command**: `node /home/csar/Documentos/Proyectos/Arkho/pfi-agent-architecture/mcp-landing-page/index.js`

### 2. Claude Desktop
Añade en tu archivo de configuración de Claude (`config.json`):
```json
{
  "mcpServers": {
    "landing-page-mcp": {
      "command": "node",
      "args": ["/home/csar/Documentos/Proyectos/Arkho/pfi-agent-architecture/mcp-landing-page/index.js"]
    }
  }
}
```

### 3. Antigravity
Registrado automáticamente si se utiliza en la suite operativa.
