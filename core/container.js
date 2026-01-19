import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import Logger from '../utils/logger.js'
import { startActiveMonitor } from '../utils/monitor.js'

export const execAsync = promisify(exec)

class Container {
  constructor(config = {}) {
    this.process = null
    this.isRunning = false
    this.monitor = null
    this.config = {
      containerName: config.containerName || 'container-base',
      ...config
    }
  }

  async shell(command, showProgress = false) {
    if (!this.isRunning) throw new Error('Container offline.')
    
    const args = ['exec', this.config.containerName, '/bin/bash', '-c', command]
    
    return new Promise((resolve, reject) => {
      const proc = spawn('podman', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      let output = ''
      let errorOutput = ''

      proc.stdout.on('data', (data) => {
        const str = data.toString()
        output += str
        if (showProgress) Logger.progress(str.trim())
      })

      proc.stderr.on('data', (data) => {
        const str = data.toString()
        errorOutput += str
        
        if (showProgress) {
          // Tenta encontrar um padrão de percentual (ex: 45.2%)
          const match = str.match(/(\d+(\.\d+)?%)/)
          if (match) {
            Logger.progress(`Baixando modelo... ${match[0]}`)
          }
        }
      })

      proc.on('close', (code) => {
        if (showProgress) console.log('') // Nova linha após o progresso
        if (code === 0) resolve(output.trim())
        else reject(new Error(errorOutput.trim() || `Erro ${code}`))
      })
    })
  }

  terminal(message = `Abrindo terminal bash em ${this.config.containerName}`) {
    Logger.info(message)
    const proc = spawn('podman', ['exec', '-it', this.config.containerName, '/bin/bash'], {
      stdio: 'inherit'
    })

    return new Promise((resolve) => {
      proc.on('close', () => {
        Logger.info('Terminal encerrado.')
        resolve()
      })
    })
  }

  // Meu pequeno monitoramento zumbi
  activateMonitor(processName) {
    if (this.monitor) return
    this.monitor = startActiveMonitor(this.config.containerName, processName)
  }

  async cleanupInternalProcesses(processName) {
    try {
      await execAsync(`podman exec ${this.config.containerName} pkill -9 -f "${processName}" 2>/dev/null || true`)
    } catch (e) {}
  }

  async stop() {
    if (this.process) {
      this.process.kill('SIGKILL')
      this.process = null
    }

    if (this.monitor) {
      this.monitor.kill('SIGKILL')
      this.monitor = null
    }

    try {
      await execAsync(`podman stop -t 0 ${this.config.containerName} 2>/dev/null || podman kill ${this.config.containerName} 2>/dev/null`)
    } catch (e) {
    } finally {
      this.isRunning = false
      Logger.success(`Container ${this.config.containerName} finalizado.`)
    }
  }
}

export default Container
