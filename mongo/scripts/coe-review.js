#!/usr/bin/env node
/**
 * COE Review Autónomo — Revisor de Arquitectura IATL.
 * Escanea el projectRoot configurado, analiza su alineación arquitectónica de acuerdo a lo que encuentra
 * sin asumir la arquitectura, y compara con el target deseado y la arquitectura base configurada.
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
  console.log("🔍 Iniciando revisión autónoma de arquitectura...");
  
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

  // 2. Detección DInámica de la Arquitectura Existente (Sin Asumir)
  // Contar palabras clave en los nombres de directorios
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

  // Determinar arquitectura predominante detectada
  let detectedArch = "Monolito Plano / Script-based";
  let maxScore = 0;

  if (hexagonalIndicators >= 2 && hexagonalIndicators >= mvcIndicators && hexagonalIndicators >= layeredIndicators) {
    detectedArch = "Hexagonal / Clean Architecture";
    maxScore = hexagonalIndicators;
  } else if (mvcIndicators >= 2 && mvcIndicators >= layeredIndicators) {
    detectedArch = "MVC (Model-View-Controller)";
    maxScore = mvcIndicators;
  } else if (layeredIndicators >= 2) {
    detectedArch = "Layered / 3-Tier (Controllers-Services-Repositories)";
    maxScore = layeredIndicators;
  } else if (serverlessIndicators >= 2) {
    detectedArch = "Serverless / Event-Driven Functions";
    maxScore = serverlessIndicators;
  }

  // 3. Evaluar frameworks y dependencias en package.json
  const deps = packageJson?.dependencies ?? {};
  const devDeps = packageJson?.devDependencies ?? {};
  const usesNest = deps["@nestjs/core"] || devDeps["@nestjs/core"];
  const usesTypeORM = deps["typeorm"] || deps["@nestjs/typeorm"];
  const usesAwsSdk = deps["aws-sdk"] || deps["@aws-sdk/client-s3"] || devDeps["aws-sdk"];

  // 4. Analizar violaciones de acoplamiento y archivos complejos
  const violations = [];
  const largeFiles = [];
  const codeFiles = files.filter((f) => /\.(ts|js|mjs)$/.test(f.name));

  for (const file of codeFiles) {
    const relPath = relative(projectRoot, file.path);
    
    // Regla de archivos grandes (>600 líneas)
    if (file.size > 24000) {
      try {
        const content = readFileSync(file.path, "utf8");
        const lines = content.split("\n").length;
        if (lines > 600) {
          largeFiles.push({ path: relPath, lines });
        }
      } catch (e) {}
    }

    // Si se detecta Hexagonal o se busca Hexagonal, chequear acoplamiento del Dominio
    if (/domain|core/i.test(relPath)) {
      try {
        const content = readFileSync(file.path, "utf8");
        const imports = [];
        if (/@nestjs\//.test(content)) imports.push("NestJS Framework");
        if (/typeorm|sequelize|mongoose|prisma/i.test(content)) imports.push("ORM/Database");
        if (/aws-sdk|@aws-sdk/i.test(content)) imports.push("AWS SDK");

        if (imports.length > 0) {
          violations.push({
            file: relPath,
            imports: imports.join(", "),
            reason: "Acoplamiento del Dominio: el núcleo del negocio no debe depender de infraestructura o frameworks de red/base de datos.",
          });
        }
      } catch (e) {}
    }
  }

  // 5. Comparar arquitectura detectada con la declarada y el target
  const matchesDeclared = detectedArch.toLowerCase().includes(archCurrentDeclared.toLowerCase()) || 
                          (archCurrentDeclared.toLowerCase() === "hexagonal" && detectedArch.includes("Hexagonal")) ||
                          (archCurrentDeclared.toLowerCase() === "mvc" && detectedArch.includes("MVC")) ||
                          (archCurrentDeclared.toLowerCase() === "layered" && detectedArch.includes("Layered"));

  const matchesTarget = detectedArch.toLowerCase().includes(archTarget.toLowerCase()) ||
                        (archTarget.toLowerCase().includes("hexagonal") && detectedArch.includes("Hexagonal")) ||
                        (archTarget.toLowerCase().includes("serverless") && detectedArch.includes("Serverless"));

  // 6. Calcular puntaje dinámico basado en la brecha con el target
  let gapScore = 100;
  const gaps = [];

  if (!matchesTarget) {
    gapScore -= 30; // penalización si la arquitectura detectada no coincide con el target
    gaps.push(`La arquitectura detectada (${detectedArch}) no coincide con la arquitectura objetivo deseadas (${archTarget}).`);
  }

  if (archTarget.includes("hexagonal")) {
    if (!dirNames.some((n) => /domain|core/i.test(n))) {
      gapScore -= 15;
      gaps.push("Falta la capa de Dominio (domain/core) para aislar las reglas de negocio puras.");
    }
    if (!dirNames.some((n) => /infrastructure|adapters|infra/i.test(n))) {
      gapScore -= 15;
      gaps.push("Falta la capa de Infraestructura/Adaptadores (adapters/infrastructure) para desacoplar bases de datos y frameworks.");
    }
    if (!dirNames.some((n) => /ports|interfaces|entrypoints/i.test(n))) {
      gapScore -= 10;
      gaps.push("Falta definir Puertos/Interfaces claros para la comunicación con el exterior.");
    }
  }

  if (violations.length > 0) {
    gapScore -= Math.min(violations.length * 5, 20);
  }
  if (largeFiles.length > 0) {
    gapScore -= Math.min(largeFiles.length * 5, 10);
  }

  const finalScore = Math.max(gapScore, 10);

  // 7. Generar reporte Markdown
  const timestamp = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
  
  let report = `# 🛡️ COE Review de Arquitectura Dinámico — ${project.toUpperCase()}

Generado de forma autónoma por el agente de revisión de código de IATL (**@pfi-code-reviewer** / **Daniel Chiang**).

## 📊 Resumen Ejecutivo
- **Proyecto Analizado:** \`${project}\`
- **Ruta Root:** \`${projectRoot}\`
- **Fecha de Análisis:** \`${timestamp}\`

### ⚙️ Configuración del Entorno de Instalación
- **Arquitectura Base Declarada (Base/Root):** \`${archCurrentDeclared}\`
- **Arquitectura Objetivo Deseada (Target):** \`${archTarget}\`
- **Arquitectura Real Detectada en Código:** \`${detectedArch}\`
- **Alineación Declarado vs Detectado:** ${matchesDeclared ? "✅ Consistente" : "⚠️ Desviado (Declaraste '" + archCurrentDeclared + "' pero detectamos '" + detectedArch + "')"}
- **Puntaje de Alineación con el Target (COE Score):** \`${finalScore}/100\`

---

## 🏛️ Análisis Estructural del Código Encontrado

El escáner analizó dinámicamente las carpetas y dependencias de la base de código, arrojando el siguiente diagnóstico:

### 📁 Carpetas Relevantes Detectadas
${dirs.length === 0 ? "*El directorio raíz está plano o no tiene carpetas organizativas.*" : dirs.map((d) => `- \`${relative(projectRoot, d.path)}\``).slice(0, 15).join("\n")}
${dirs.length > 15 ? `*... y ${dirs.length - 15} carpetas más.*` : ""}

### 🛠️ Ecosistema Tecnológico Encontrado
- **Framework Principal:** ${usesNest ? "NestJS" : (packageJson ? "Node.js estándar / Express" : "No detectado en package.json o sin dependencias estándar")}
- **Acceso a Datos / ORM:** ${usesTypeORM ? "TypeORM" : "No se detectaron ORMs comunes en las dependencias"}
- **Infraestructura Cloud:** ${hasServerless ? "Serverless Framework" : hasCDK ? "AWS CDK" : hasSAM ? "AWS SAM" : "No se detectaron herramientas de infraestructura como código en raíz"}

---

## 🔀 Brechas y Gaps Arquitectónicos (Target: ${archTarget})

${
  gaps.length === 0
    ? "✅ **El proyecto está perfectamente alineado con los objetivos del target de arquitectura.**"
    : `### ⚠️ Desviaciones y Tareas Pendientes para llegar al Target:
${gaps.map((g) => `- ${g}`).join("\n")}`
}

### 1. Acoplamiento del Dominio a Infraestructura (Total: ${violations.length})
${
  violations.length === 0
    ? "*No se detectaron importaciones de infraestructura acopladas en capas de dominio.*"
    : violations
        .map(
          (v) =>
            `- **Archivo:** [\`${v.file}\`](file:///${join(projectRoot, v.file)})\n  - **Importaciones detectadas:** \`${v.imports}\`\n  - **Problema:** ${v.reason}`,
        )
        .join("\n")
}

### 2. Archivos Monolíticos / Complejos (Total: ${largeFiles.length})
${
  largeFiles.length === 0
    ? "*No se detectaron archivos de código excesivamente extensos (>600 líneas).*"
    : largeFiles
        .map(
          (lf) =>
            `- **Archivo:** [\`${lf.path}\`](file:///${join(projectRoot, lf.path)}) (${lf.lines} líneas)`,
        )
        .join("\n")
}

---

## 💡 Recomendaciones y Plan de Acción del COE

1. **Alinear la Estructura de Directorios:** Si tu objetivo es \`${archTarget}\`, reestructura el proyecto base creando carpetas específicas de acuerdo a los hallazgos descritos arriba.
2. **Desacoplar Reglas de Negocio:** Asegura que los módulos de lógica pura no importen librerías de conexión de red o frameworks. Usa inyección de dependencias para los adaptadores.
3. **Reducción de Deuda Técnica:** Refactoriza los archivos complejos reportados para asegurar un mantenimiento ágil y pruebas unitarias rápidas.

---
*Reporte de análisis arquitectónico autónomo sin asunciones previas.*
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
