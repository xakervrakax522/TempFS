import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * O Monitor é um processo "zumbi reverso". 
 * Ele roda em background e observa o PID do processo principal.
 */
export function startActiveMonitor(containerName, processToKill = null, persistent = false) {
  const parentPid = process.pid
  const scriptPath = __filename

  const args = [
    scriptPath,
    '--child',
    containerName,
    parentPid.toString(),
    processToKill || '',
    persistent ? 'true' : 'false'
  ]

  const child = spawn('node', args, {
    detached: true,
    stdio: 'ignore'
  })

  child.unref()
  return child
}

if (process.argv.includes('--child')) {
  const [,, , containerName, parentPidStr, processToKill, persistentStr] = process.argv
  const parentPid = parseInt(parentPidStr, 10)
  const isPersistent = persistentStr === 'true'
  const { execSync } = await import('child_process')

  function cleanup() {
    try {
      if (processToKill) {
        execSync(`podman exec ${containerName} pkill -9 -f "${processToKill}" 2>/dev/null || true`)
      }
      
      if (!isPersistent) {
        execSync(`podman rm -f ${containerName} 2>/dev/null || true`)
      } else {
        // Se for persistente, apenas para o container em vez de remover
        execSync(`podman stop -t 0 ${containerName} 2>/dev/null || true`)
      }
    } catch (e) {
      // Silencioso hehe (pessima pratica)
    }
  }

  const timer = setInterval(() => {
    try {
      // Verifica se o processo pai ainda existe
      process.kill(parentPid, 0)
    } catch (e) {
      // O pai morreu!
      clearInterval(timer)
      cleanup()
      process.exit(0)
    }
  }, 1000)
}