#!/usr/bin/env node
/**
 * COE Review Autónomo — Revisor de Arquitectura y Buenas Prácticas IATL.
 * Escanea el projectRoot configurado, analiza su alineación arquitectónica de acuerdo a lo que encuentra,
 * realiza una revisión estática del código para detectar buenas y malas prácticas, y reporta hallazgos detallados.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, basename } from "node:path";
import { loadConfig } from "./lib/config.js";

function scanDir(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  let files = [];
  try {
    const list = readdirSync(dir);
    for (const name of list) {
      if (
        [
          "node_modules",
          ".git",
          ".serverless",
          "dist",
          "build",
          "coverage",
          ".gemini",
          ".cursor",
          ".antigravity",
        ].includes(name)
      ) {
        continue;
      }
      const fullPath = join(dir, name);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push({ type: "dir", path: fullPath, name });
        files.push(...scanDir(fullPath, maxDepth, currentDepth + 1));
      } else if (stat.isFile()) {
        files.push({ type: "file", path: fullPath, name, size: stat.size });
      }
    }
  } catch (e) {
    // Ignorar si hay problemas de lectura
  }
  return files;
}

async function main() {
  console.log("🔍 Iniciando revisión autónoma y exhaustiva de arquitectura y código...");
  
  const config = loadConfig();
  const projectRoot = config.projectRoot;
  const project = config.project ?? "pfi-backend-core";
  
  const archTarget = config.architectureTarget ?? "hexagonal-lambda-nestjs";
  const archCurrentDeclared = config.architectureCurrent ?? "layered";

  if (!projectRoot) {
    console.error("❌ Error: No se ha configurado un projectRoot en config.json.");
    process.exit(1);
  }

  if (!existsSync(projectRoot)) {
    console.error(`❌ Error: La ruta projectRoot '${projectRoot}' no existe.`);
    process.exit(1);
  }

  console.log(`📂 Escaneando proyecto: ${project} en ${projectRoot}`);
  const allEntries = scanDir(projectRoot);
  const files = allEntries.filter((e) => e.type === "file");
  const dirs = allEntries.filter((e) => e.type === "dir");

  // 1. Analizar package.json
  let packageJson = null;
  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch (e) {
      // Ignorar errores de sintaxis
    }
  }

  // 2. Detección Dinámica de la Arquitectura Existente (Sin Asumir)
  const dirNames = dirs.map((d) => d.name.toLowerCase());
  
  let hexagonalIndicators = 0;
  if (dirNames.some((n) => /domain|core/i.test(n))) hexagonalIndicators++;
  if (dirNames.some((n) => /application|usecases|use-cases/i.test(n))) hexagonalIndicators++;
  if (dirNames.some((n) => /infrastructure|adapters|infra/i.test(n))) hexagonalIndicators++;
  if (dirNames.some((n) => /ports|entrypoints|interfaces/i.test(n))) hexagonalIndicators++;

  let mvcIndicators = 0;
  if (dirNames.some((n) => /controller/i.test(n))) mvcIndicators++;
  if (dirNames.some((n) => /model/i.test(n))) mvcIndicators++;
  if (dirNames.some((n) => /view/i.test(n))) mvcIndicators++;

  let layeredIndicators = 0;
  if (dirNames.some((n) => /service/i.test(n))) layeredIndicators++;
  if (dirNames.some((n) => /controller/i.test(n))) layeredIndicators++;
  if (dirNames.some((n) => /repository|dao/i.test(n))) layeredIndicators++;

  let serverlessIndicators = 0;
  const hasServerlessFile = files.some((f) => f.name === "serverless.yml" || f.name === "serverless.yaml");
  const hasServerless = hasServerlessFile;
  const hasCDK = files.some((f) => f.name === "cdk.json");
  const hasSAM = files.some((f) => f.name === "template.yaml" || f.name === "template.yml");
  if (hasServerlessFile) serverlessIndicators += 2;
  if (hasSAM) serverlessIndicators += 2;
  if (dirNames.some((n) => /handler|lambda|function/i.test(n))) serverlessIndicators++;

  let detectedArch = "Monolito Plano / Script-based";
  if (hexagonalIndicators >= 2 && hexagonalIndicators >= mvcIndicators && hexagonalIndicators >= layeredIndicators) {
    detectedArch = "Hexagonal / Clean Architecture";
  } else if (mvcIndicators >= 2 && mvcIndicators >= layeredIndicators) {
    detectedArch = "MVC (Model-View-Controller)";
  } else if (layeredIndicators >= 2) {
    detectedArch = "Layered / 3-Tier (Controllers-Services-Repositories)";
  } else if (serverlessIndicators >= 2) {
    detectedArch = "Serverless / Event-Driven Functions";
  }

  // 3. Evaluar frameworks y dependencias
  const deps = packageJson?.dependencies ?? {};
  const devDeps = packageJson?.devDependencies ?? {};
  const usesNest = deps["@nestjs/core"] || devDeps["@nestjs/core"];
  const usesTypeORM = deps["typeorm"] || deps["@nestjs/typeorm"];
  const usesAwsSdk = deps["aws-sdk"] || deps["@aws-sdk/client-s3"] || devDeps["aws-sdk"];

  // 4. ESTRATEGIA EXHAUSTIVA DE ANÁLISIS DE CÓDIGO (Buenas y Malas Prácticas)
  const codeFiles = files.filter((f) => /\.(ts|js|mjs|java|py|go|cs)$/.test(f.name));
  
  const badPractices = [];
  const goodPractices = [];
  const largeFiles = [];
  
  // Archivos de configuración de calidad encontrados
  const linterConfigs = files.filter((f) => /eslint|prettier|tsconfig|package\.json/i.test(f.name)).map(f => f.name);
  if (linterConfigs.length > 0) {
    goodPractices.push({
      category: "Herramientas de Calidad",
      description: `Se detectaron archivos de configuración de calidad: ${linterConfigs.join(", ")}.`
    });
  }

  // Archivos de Test detectados
  const testFiles = files.filter((f) => /\.(spec|test|step)\./i.test(f.name));
  if (testFiles.length > 0) {
    goodPractices.push({
      category: "Pruebas Unitarias / Integración",
      description: `Se encontraron ${testFiles.length} archivos de pruebas (.spec / .test), lo cual promueve la estabilidad y cobertura.`
    });
  }

  for (const file of codeFiles) {
    const relPath = relative(projectRoot, file.path);
    let content = "";
    try {
      content = readFileSync(file.path, "utf8");
    } catch (e) {
      continue;
    }

    const lines = content.split("\n");

    // A. Archivos complejos/grandes
    if (lines.length > 500) {
      largeFiles.push({ path: relPath, lines: lines.length });
    }

    // B. Buscar inyección de dependencias (NestJS/Spring)
    if (content.includes("@Injectable") || content.includes("@Inject") || content.includes("@Autowired")) {
      goodPractices.push({
        category: "Inyección de Dependencias",
        file: relPath,
        description: "Uso correcto de inyección de dependencias para el desacoplamiento de componentes."
      });
    }

    // C. Buscar DTOs e interfaces de validación
    if (content.includes("@IsString") || content.includes("@IsNotEmpty") || content.includes("class Validator")) {
      goodPractices.push({
        category: "Validación de Entradas",
        file: relPath,
        description: "Implementación de decoradores de validación de datos (class-validator/DTO) para robustecer los endpoints."
      });
    }

    // D. Escaneo de malas prácticas línea por línea
    let subscriptionChecked = false;
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Secretos o credenciales harcodeadas
      if (/(password|secret|token|api_key|private_key|passwd|clave)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\/]{10,}['"`]/i.test(line)) {
        // Ignorar si parece ser parte de una prueba o un mock obvio
        if (!line.includes("mock") && !line.includes("test")) {
          badPractices.push({
            file: relPath,
            line: lineNum,
            code: line.trim(),
            category: "Seguridad / Secretos Expuestos",
            reason: "Posible credencial, contraseña o clave API harcodeada directamente en el código de producción."
          });
        }
      }

      // 2. Uso abusivo de 'any' en TypeScript o python 'Any'
      if (/\bany\b/.test(line) && file.name.endsWith(".ts") && !line.includes("eslint-disable")) {
        // Evitar falsos positivos comunes
        if (line.includes(":") && !line.includes("import") && !line.includes("function") && !line.includes("class")) {
          badPractices.push({
            file: relPath,
            line: lineNum,
            code: line.trim(),
            category: "Calidad de Tipado",
            reason: "Uso del tipo genérico 'any' que anula la seguridad y ventajas de TypeScript."
          });
        }
      }

      // 3. console.log directo en vez de usar un logger (o print en Python)
      if (/\bconsole\.log\(/.test(line) && !line.includes("//")) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Logger / Depuración",
          reason: "Uso de console.log en código operativo. Se recomienda implementar un logger estructurado."
        });
      } else if (file.name.endsWith(".py") && /^\s*print\(/.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Logger / Depuración (Python)",
          reason: "Uso de print() directo en código operativo. Se recomienda usar la librería estándar de logging para estructurar los logs."
        });
      }

      // 4. Comentarios TODO/FIXME pendientes
      if (/\/\/\s*(TODO|FIXME|XXX)/i.test(line) || /#\s*(TODO|FIXME|XXX)/i.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Deuda Técnica Pendiente",
          reason: "Comentario de tarea pendiente o bug conocido sin resolver (TODO/FIXME)."
        });
      }

      // 5. Código comentado (comentarios que parecen código ejecutable)
      if (/^\s*\/\/\s*(const|let|var|function|class|if|import|return)\b/.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Código Comentado",
          reason: "Bloques de código comentados en producción. Se recomienda eliminarlos ya que el control de versiones (Git) mantiene el historial."
        });
      } else if (file.name.endsWith(".py") && /^\s*#\s*(import|def|class|if|for|while|return)\b/.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Código Comentado (Python)",
          reason: "Bloque de código comentado detectado en Python. Se recomienda eliminarlo para mantener la limpieza de la base de código."
        });
      }

      // 6. Consultas SQL o MongoDB directamente en el controlador o capa externa
      if (/select\s+.*\s+from|db\..*\.find/i.test(line) && /controller/i.test(relPath)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Acoplamiento de Datos",
          reason: "Consultas de base de datos directamente en la capa de transporte/controladores. Violaría la responsabilidad única."
        });
      }

      // 7. [Python] Captura genérica de excepciones
      if (file.name.endsWith(".py") && /^\s*except\s*(\s+Exception)?\s*:/.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Manejo de Errores (Python)",
          reason: "Bloque de captura genérico 'except Exception:'. Puede enmascarar errores inesperados. Se recomienda capturar excepciones específicas o registrar/relanzar la excepción."
        });
      }

      // 8. [Python] Modificación de estado global
      if (file.name.endsWith(".py") && /\bglobal\s+[a-zA-Z_]/.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Diseño / Variables Globales",
          reason: "Uso de la palabra clave 'global'. Aumenta el acoplamiento y dificulta la modularización y pruebas unitarias."
        });
      }

      // 9. [Angular] Acceso directo al DOM
      if (file.name.endsWith(".ts") && /document\./.test(line) && !line.includes("typeof document")) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Acceso Directo al DOM (Angular)",
          reason: "Acceso directo a la API global 'document'. En Angular se prefiere usar ElementRef, Renderer2, o ViewChild para mantener compatibilidad con SSR o Web Workers."
        });
      }

      // 10. [Angular] URLs Hardcodeadas en servicios
      if (file.name.endsWith(".ts") && !relPath.includes("environment") && /(http|https):\/\/[a-zA-Z0-9_\-\.]+/.test(line)) {
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Configuración Hardcodeada (Angular)",
          reason: "Dirección URL absoluta hardcodeada en el código. Se recomienda moverla a environment.ts o un servicio de configuración."
        });
      }

      // 11. [Angular] Fugas de memoria por suscripción activa
      if (file.name.endsWith(".ts") && content.includes(".subscribe(") && !content.includes("unsubscribe") && !content.includes("takeUntil") && !content.includes("Subscription") && !subscriptionChecked) {
        subscriptionChecked = true;
        badPractices.push({
          file: relPath,
          line: lineNum,
          code: line.trim(),
          category: "Fuga de Memoria (Angular)",
          reason: "Se detectó uso de '.subscribe()' sin unsubscribe explícito ni uso de patrones de limpieza como takeUntil o async pipe. Esto puede causar fugas de memoria al destruir el componente."
        });
      }
    });

    // E. Reglas de Acoplamiento de Dominio en Hexagonal
    if (/domain|core/i.test(relPath)) {
      const imports = [];
      if (/@nestjs\//.test(content)) imports.push("NestJS Framework");
      if (/typeorm|sequelize|mongoose|prisma/i.test(content)) imports.push("ORM/Database");
      if (/aws-sdk|@aws-sdk/i.test(content)) imports.push("AWS SDK");

      if (imports.length > 0) {
        badPractices.push({
          file: relPath,
          line: 1,
          code: "Importación externa en módulo del Dominio",
          category: "Acoplamiento del Dominio",
          reason: `El núcleo de negocio (domain) contiene acoplamiento directo a infraestructura/frameworks: [${imports.join(", ")}].`
        });
      }
    }
  }

  // 5. Comparar arquitectura detectada con la declarada y el target
  const matchesDeclared = !archCurrentDeclared || 
                          detectedArch.toLowerCase().includes(archCurrentDeclared.toLowerCase()) || 
                          (archCurrentDeclared.toLowerCase() === "hexagonal" && detectedArch.includes("Hexagonal")) ||
                          (archCurrentDeclared.toLowerCase() === "mvc" && detectedArch.includes("MVC")) ||
                          (archCurrentDeclared.toLowerCase() === "layered" && detectedArch.includes("Layered"));

  const matchesTarget = !archTarget ||
                        detectedArch.toLowerCase().includes(archTarget.toLowerCase()) ||
                        (archTarget.toLowerCase().includes("hexagonal") && detectedArch.includes("Hexagonal")) ||
                        (archTarget.toLowerCase().includes("serverless") && detectedArch.includes("Serverless")) ||
                        (archTarget.toLowerCase().includes("capas") && detectedArch.includes("Layered"));

  // 6. Calcular puntaje dinámico basado en la brecha con el target y malas prácticas
  let gapScore = 100;
  const gaps = [];

  if (archTarget && !matchesTarget) {
    gapScore -= 25;
    gaps.push(`La arquitectura real detectada (${detectedArch}) no coincide con la arquitectura objetivo deseada (${archTarget}).`);
  }

  if (archTarget) {
    if (archTarget.toLowerCase().includes("hexagonal") || archTarget.toLowerCase().includes("clean")) {
      if (!dirNames.some((n) => /domain|core/i.test(n))) {
        gapScore -= 15;
        gaps.push("Falta la carpeta o capa de Dominio pura (domain/core).");
      }
      if (!dirNames.some((n) => /infrastructure|adapters|infra/i.test(n))) {
        gapScore -= 15;
        gaps.push("Falta la capa de Infraestructura/Adaptadores (adapters/infrastructure).");
      }
    } else if (archTarget.toLowerCase().includes("capas") || archTarget.toLowerCase().includes("layered")) {
      if (!dirNames.some((n) => /service/i.test(n))) {
        gapScore -= 10;
        gaps.push("Falta la carpeta o capa lógica de Servicios (services).");
      }
      if (!dirNames.some((n) => /repository|dao/i.test(n))) {
        gapScore -= 10;
        gaps.push("Falta la carpeta o capa de acceso a datos (repositories/dao).");
      }
    }
  }

  // Descuento por malas prácticas acumuladas (máx 30 puntos)
  const deductions = Math.min(badPractices.length * 2, 30);
  gapScore -= deductions;

  // Descuento por archivos gigantes (máx 10 puntos)
  gapScore -= Math.min(largeFiles.length * 3, 10);

  const finalScore = Math.max(gapScore, 5);

  // 7. Generar reporte Markdown exhaustivo
  const timestamp = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
  
  let report = `# 🛡️ COE Review de Arquitectura y Código — ${project.toUpperCase()}

Reporte de revisión de código estático y alineación arquitectónica generado de forma autónoma por **@pfi-code-reviewer** (**Daniel Chiang**).

## 📊 Resumen Ejecutivo
- **Proyecto Analizado:** \`${project}\`
- **Ruta Root:** \`${projectRoot}\`
- **Fecha de Análisis:** \`${timestamp}\`

### ⚙️ Configuración y Estado del Proyecto
`;

  if (archCurrentDeclared) {
    report += `- **Arquitectura Base Declarada (Base/Root):** \`${archCurrentDeclared}\`\n`;
  }
  if (archTarget) {
    report += `- **Arquitectura Objetivo Deseada (Target):** \`${archTarget}\`\n`;
  }
  report += `- **Arquitectura Real Detectada en Código:** \`${detectedArch}\`\n`;
  if (archCurrentDeclared && archTarget) {
    report += `- **Alineación Declarado vs Detectado:** ${matchesDeclared ? "✅ Consistente" : "⚠️ Desviado (Declaraste '" + archCurrentDeclared + "' pero detectamos '" + detectedArch + "')"}\n`;
  }
  report += `- **Puntaje de Alineación y Calidad (COE Score):** \`${finalScore}/100\`\n\n---\n`;

  report += `
## 🏛️ Análisis Estructural y Tecnológico

El escáner analizó dinámicamente las carpetas y dependencias de la base de código, arrojando el siguiente diagnóstico:

### 📁 Carpetas Relevantes Detectadas
${dirs.length === 0 ? "*El directorio raíz está plano o no tiene carpetas organizativas.*" : dirs.map((d) => `- \`${relative(projectRoot, d.path)}\``).slice(0, 15).join("\n")}
${dirs.length > 15 ? `*... y ${dirs.length - 15} carpetas más.*` : ""}

### 🛠️ Ecosistema Tecnológico Encontrado
- **Framework Principal:** ${usesNest ? "NestJS" : (packageJson ? "Node.js estándar / Express" : "No detectado en package.json o sin dependencias estándar")}
- **Acceso a Datos / ORM:** ${usesTypeORM ? "TypeORM" : "No se detectaron ORMs comunes en las dependencias"}
- **Infraestructura Cloud:** ${hasServerless ? "Serverless Framework" : hasCDK ? "AWS CDK" : hasSAM ? "AWS SAM" : "No se detectaron herramientas de infraestructura como código en raíz"}

---

## 📈 Buenas Prácticas Detectadas (Total: ${goodPractices.length})

${
  goodPractices.length === 0
    ? "*No se registraron indicadores automáticos de buenas prácticas estándar.*"
    : goodPractices.map((g) => `- **${g.category}:** ${g.description} ${g.file ? `(en \`${g.file}\`)` : ""}`).join("\n")
}

---

## ⚠️ Malas Prácticas y Code Smells Detectados (Total: ${badPractices.length})

Se realizó un escaneo profundo en la lógica y sintaxis de los archivos de código fuente:

${
  badPractices.length === 0
    ? "✅ **Felicidades! No se detectaron malas prácticas obvias de seguridad, tipado o acoplamiento.**"
    : badPractices.slice(0, 30).map((bp) => {
        const ext = bp.file.split('.').pop();
        return `### 🚨 [${bp.category}] en [${bp.file}:${bp.line}](file:///${join(projectRoot, bp.file)}#L${bp.line})
- **Problema:** ${bp.reason}
- **Línea de Código:**
  \`\`\`${ext}
  ${bp.code}
  \`\`\`
`;
      }).join("\n")
}
${badPractices.length > 30 ? `\n*... y ${badPractices.length - 30} malas prácticas adicionales.*` : ""}

---

## 📄 Archivos Monolíticos / Complejos (>500 líneas) (Total: ${largeFiles.length})
${
  largeFiles.length === 0
    ? "*Excelente. Todos los archivos de código son compactos y legibles (<500 líneas).* "
    : largeFiles.map((lf) => `- **Archivo:** [\`${lf.path}\`](file:///${join(projectRoot, lf.path)}) (${lf.lines} líneas)`).join("\n")
}

---
`;

  if (archTarget) {
    report += `
## 🔀 Brechas y Gaps Arquitectónicos (Target: ${archTarget})

${
  gaps.length === 0
    ? "✅ **El proyecto está alineado con los objetivos del target de arquitectura.**"
    : `### ⚠️ Desviaciones y Tareas Pendientes para llegar al Target:
${gaps.map((g) => `- ${g}`).join("\n")}`
}

---
`;
  }

  report += `
## 💡 Recomendaciones y Plan de Acción del COE
`;

  let recIndex = 1;
  if (archTarget) {
    report += `\n${recIndex++}. **Alinear la Estructura de Directorios:** Si tu objetivo es \`${archTarget}\`, reestructura el proyecto base de acuerdo a los hallazgos descritos arriba.`;
  }
  report += `\n${recIndex++}. **Eliminar Secretos Expuestos:** Asegúrate de mover cualquier contraseña o token duro a variables de entorno (\`.env\` / secret manager).`;
  report += `\n${recIndex++}. **Limpieza de logs y código comentado:** Remueve los \`console.log\` de depuración y limpia el código comentado para facilitar la lectura.

---
*Reporte de análisis arquitectónico autónomo e integral sin asunciones previas.*
`;

  const destPath = join(projectRoot, "COE-REVIEW.md");
  try {
    writeFileSync(destPath, report, "utf8");
    console.log(`\n🎉 Reporte COE-REVIEW.md escrito con éxito en:\n👉 ${destPath}\n`);
  } catch (err) {
    console.error(`❌ Error al escribir el reporte en ${destPath}:`, err.message);
    const fallbackPath = join(resolve(projectRoot), "COE-REVIEW.md");
    writeFileSync(fallbackPath, report, "utf8");
    console.log(`⚠️ Se escribió un reporte de respaldo en: ${fallbackPath}`);
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
