#!/usr/bin/env node
/**
 * COE Review Autónomo — Revisor de Arquitectura IATL.
 * Escanea el projectRoot configurado, analiza su alineación arquitectónica y genera un reporte COE-REVIEW.md.
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

  // 2. Analizar estructura de directorios
  const hasSrc = dirs.some((d) => d.name === "src");
  const hasDomain = dirs.some((d) => /domain|core/i.test(d.name));
  const hasApplication = dirs.some((d) => /application|usecases|use-cases/i.test(d.name));
  const hasInfrastructure = dirs.some((d) => /infrastructure|adapters|infra/i.test(d.name));
  const hasPorts = dirs.some((d) => /ports|interfaces|entrypoints/i.test(d.name));

  // 3. Evaluar frameworks y herramientas de desplaje
  const hasServerless = files.some((f) => f.name === "serverless.yml" || f.name === "serverless.yaml");
  const hasCDK = files.some((f) => f.name === "cdk.json") || dirs.some((d) => d.name === "cdk");
  const hasSAM = files.some((f) => f.name === "template.yaml" || f.name === "template.yml");

  // 4. Analizar dependencias en package.json
  const deps = packageJson?.dependencies ?? {};
  const devDeps = packageJson?.devDependencies ?? {};
  const usesNest = deps["@nestjs/core"] || devDeps["@nestjs/core"];
  const usesTypeORM = deps["typeorm"] || deps["@nestjs/typeorm"];
  const usesAwsSdk = deps["aws-sdk"] || deps["@aws-sdk/client-s3"] || devDeps["aws-sdk"];

  // 5. Analizar violaciones de acoplamiento en archivos del dominio (Hexagonal check)
  const violations = [];
  const largeFiles = [];

  const codeFiles = files.filter((f) => /\.(ts|js|mjs)$/.test(f.name));

  for (const file of codeFiles) {
    const relPath = relative(projectRoot, file.path);
    
    // Regla de archivos grandes
    if (file.size > 24000) { // aprox > 600-800 líneas
      try {
        const content = readFileSync(file.path, "utf8");
        const lines = content.split("\n").length;
        if (lines > 600) {
          largeFiles.push({ path: relPath, lines });
        }
      } catch (e) {}
    }

    // Regla de acoplamiento del Dominio (solo si el path tiene 'domain' o 'core')
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
            reason: "El dominio no debe acoplarse a librerías de infraestructura, frameworks ni ORMs directos.",
          });
        }
      } catch (e) {}
    }
  }

  // 6. Calcular puntajes
  let scoreArchitecture = 20; // base por tener archivos ts/js
  if (hasDomain) scoreArchitecture += 20;
  if (hasApplication) scoreArchitecture += 20;
  if (hasInfrastructure) scoreArchitecture += 20;
  if (hasPorts || hasSrc) scoreArchitecture += 20;

  // Penalizar por violaciones arquitectónicas
  const violationPenalties = Math.min(violations.length * 10, 40);
  const finalScore = Math.max(scoreArchitecture - violationPenalties, 10);

  // 7. Generar reporte Markdown
  const timestamp = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
  
  let report = `# 🛡️ COE Review de Arquitectura — ${project.toUpperCase()}

Generado de forma autónoma por el agente de revisión de código de IATL (**@pfi-code-reviewer** / **Daniel Chiang**).

## 📊 Resumen Ejecutivo
- **Proyecto Analizado:** \`${project}\`
- **Ruta Root:** \`${projectRoot}\`
- **Target Arquitectónico:** \`${archTarget}\`
- **Fecha de Análisis:** \`${timestamp}\`
- **Puntaje de Alineación Arquitectónica (COE):** \`${finalScore}/100\`

---

## 🏛️ Diagnóstico de la Estructura de Directorios

Evaluación de componentes del patrón **Hexagonal**:

| Capa / Patrón | Estado | Observación |
| :--- | :---: | :--- |
| **Dominio (Domain/Core)** | ${hasDomain ? "✅ Detectado" : "❌ No detectado"} | Contiene las entidades y reglas de negocio puras. |
| **Aplicación (Application/Cases)** | ${hasApplication ? "✅ Detectado" : "❌ No detectado"} | Casos de uso e interfaces de servicios. |
| **Infraestructura (Infrastructure/Adapters)** | ${hasInfrastructure ? "✅ Detectado" : "❌ No detectado"} | Adaptadores de bases de datos, APIs externas y frameworks. |
| **Puertos/Interfaces (Ports/Entrypoints)** | ${hasPorts || hasSrc ? "✅ Detectado" : "❌ No detectado"} | Controladores HTTP, Lambda handlers o puntos de entrada del sistema. |

### 🛠️ Frameworks y Tecnologías Detectadas
- **Framework Principal:** ${usesNest ? "NestJS" : (packageJson ? "Node.js estándar / Express" : "No detectado en package.json")}
- **Acceso a Datos / ORM:** ${usesTypeORM ? "TypeORM (común en NestJS)" : "No se detectaron ORMs comunes en las dependencias directas"}
- **Infraestructura Cloud:** ${hasServerless ? "Serverless Framework" : hasCDK ? "AWS CDK" : hasSAM ? "AWS SAM" : "No se detectaron configs de CDK/Serverless en primer nivel"}
- **Uso de AWS SDK:** ${usesAwsSdk ? "Sí (instalado en dependencias)" : "No detectado"}

---

## ⚠️ Hallazgos y Desviaciones Arquitectónicas (Antipatrones)

### 1. Acoplamiento del Dominio a Infraestructura (Total: ${violations.length})
> [!IMPORTANT]
> Según los principios de Clean Architecture y Arquitectura Hexagonal, el núcleo del dominio debe ser agnóstico a la tecnología de base de datos, frameworks de red y proveedores de la nube.

${
  violations.length === 0
    ? "*¡Felicidades! No se detectaron importaciones de infraestructura en el dominio analizado.*"
    : violations
        .map(
          (v) =>
            `- **Archivo:** [\`${v.file}\`](file:///${join(projectRoot, v.file)})\n  - **Importaciones detectadas:** \`${v.imports}\`\n  - **Problema:** ${v.reason}`,
        )
        .join("\n")
}

### 2. Archivos Monolíticos / Complejos (Total: ${largeFiles.length})
> [!WARNING]
> Los archivos de código con más de 600 líneas de código incrementan el riesgo de acoplamiento, dificultan los tests unitarios y violan el Principio de Responsabilidad Única (SRP).

${
  largeFiles.length === 0
    ? "*No se detectaron archivos excesivamente grandes en el escaneo.*"
    : largeFiles
        .map(
          (lf) =>
            `- **Archivo:** [\`${lf.path}\`](file:///${join(projectRoot, lf.path)}) (${lf.lines} líneas)`,
        )
        .join("\n")
}

---

## 💡 Recomendaciones y Plan de Acción (COE)

1. **Aislamiento del Dominio:** Asegurar que las interfaces de entrada/salida (Puertos) definan el contrato y los adaptadores implementen TypeORM o llamadas a AWS SDK, manteniendo el dominio libre de importaciones directas de bases de datos.
2. **Refactorización de Controladores/Handlers:** Si hay lógicas de validación o transformación pesadas mezcladas en los controladores, moverlas a DTOs de entrada validados mediante Joi/class-validator.
3. **Modularización Lambda:** Dividir las funciones en sub-módulos si el proyecto root utiliza NestJS en Lambdas, asegurando tiempos mínimos de inicialización (cold-starts).

---
*Reporte generado automáticamente en el flujo de instalación de IATL.*
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
