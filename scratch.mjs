import { execSync } from 'child_process';
function detectIdeFromProcessTree(pid) {
  try {
    let currentPid = pid;
    while (currentPid && currentPid !== "1" && currentPid !== "0") {
      const output = execSync(`ps -o ppid= -o comm= -p ${currentPid}`).toString().trim();
      if (!output) break;
      
      const parts = output.trim().split(/\s+/);
      const ppid = parts.shift();
      const comm = parts.join(' ').toLowerCase();
      
      console.log(`PID: ${currentPid}, PPID: ${ppid}, COMM: ${comm}`);
      
      if (comm.includes('cursor')) return 'cursor';
      if (comm.includes('antigravity')) return 'antigravity';
      if (comm.includes('code')) return 'vscode';
      
      currentPid = ppid;
    }
  } catch (err) {
    console.error(err);
  }
  return 'unknown';
}
console.log("Detected IDE: " + detectIdeFromProcessTree(process.pid));
