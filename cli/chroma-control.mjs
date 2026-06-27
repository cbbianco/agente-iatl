#!/usr/bin/env node
/**
 * Herramienta de control y monitoreo de instancias de ChromaDB.
 * Permite listar los puertos activos (8010-8089) que tienen un servidor de Chroma corriendo
 * y detenerlos de manera selectiva o total.
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";

async function checkChromaServer(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/v2/heartbeat`, {
      signal: AbortSignal.timeout(1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function killProcessOnPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { stdio: "pipe" }).toString();
      const lines = out.split("\n").map(l => l.trim()).filter(Boolean);
      let killedCount = 0;
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0") {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          killedCount++;
        }
      }
      return killedCount > 0;
    } else {
      const pid = execSync(`lsof -t -i:${port}`, { stdio: "pipe" }).toString().trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        return true;
      }
    }
  } catch (e) {
    // Si falla lsof, probar pkill
    try {
      execSync(`pkill -9 -f "port ${port}"`, { stdio: "ignore" });
      return true;
    } catch {}
  }
  return false;
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  IATL — Control de Servidores ChromaDB           ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  
  console.log("🔍 Escaneando puertos activos de ChromaDB (8010-8089)...");
  
  const activeServers = [];
  for (let port = 8010; port <= 8089; port++) {
    if (await checkChromaServer(port)) {
      activeServers.push(port);
    }
  }

  if (activeServers.length === 0) {
    console.log("✅ No se detectaron servidores ChromaDB activos en segundo plano.");
    process.exit(0);
  }

  console.log(`\nSe encontraron ${activeServers.length} servidores ChromaDB activos:`);
  activeServers.forEach((port, idx) => {
    console.log(`  ${idx + 1}) Servidor Chroma en http://127.0.0.1:${port}`);
  });

  const rl = createInterface({ input, output });
  console.log(`\nOpciones de limpieza:`);
  console.log(`  1) Detener un servidor específico`);
  console.log(`  2) Detener TODOS los servidores activos`);
  console.log(`  3) Cancelar`);

  const opt = (await rl.question("\nElige una opción [1-3]: ")).trim();

  if (opt === "1") {
    const selection = (await rl.question(`Selecciona el número del servidor a detener [1-${activeServers.length}]: `)).trim();
    const idx = parseInt(selection, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= activeServers.length) {
      console.log("❌ Selección inválida.");
    } else {
      const targetPort = activeServers[idx];
      console.log(`\n🛑 Deteniendo servidor Chroma en puerto ${targetPort}...`);
      if (killProcessOnPort(targetPort)) {
        console.log("✅ Servidor detenido correctamente.");
      } else {
        console.log("⚠️ No se pudo detener el proceso de forma automática.");
      }
    }
  } else if (opt === "2") {
    console.log("\n🛑 Deteniendo TODOS los servidores de ChromaDB...");
    let successCount = 0;
    for (const port of activeServers) {
      if (killProcessOnPort(port)) {
        successCount++;
      }
    }
    console.log(`✅ Se detuvieron ${successCount} de ${activeServers.length} servidores.`);
  } else {
    console.log("Omitido.");
  }

  await rl.close();
}

main().catch(err => {
  console.error("❌ Error en herramienta de Chroma:", err.message);
  process.exit(1);
});
