import { spawn } from 'child_process'
import Container, { execAsync } from '../core/container.js'
import Logger from '../utils/logger.js'

class Llama extends Container {
  constructor(config = {}) {
    super({
      model: config.model || '',
      modelUrl: config.modelUrl || '',
      host: config.host || '0.0.0.0',
      port: config.port || 8080,
      containerName: config.containerName || 'llama-cpp',
      persistent: true,
      ...config
    })
  }

  async start() {
    try {
      Logger.inProgress(`Preparando container ${this.config.containerName}...`)

      // 1. Inicia o container primeiro
      try {
        await execAsync(`podman start ${this.config.containerName} 2>/dev/null || true`)
        await this.cleanupInternalProcesses('llama-server')
        await execAsync(`podman stop -t 0 ${this.config.containerName} 2>/dev/null || true`)
      } catch (error) {}

      await execAsync(`podman start ${this.config.containerName}`)
      this.isRunning = true

      // 2. Verifica e baixa o modelo usando o método .shell() do projeto
      try {
        Logger.info('Verificando modelo...')
        await this.shell(`ls ${this.config.model}`)
        Logger.success('Modelo encontrado.')
      } catch (e) {
        Logger.warning('Modelo não encontrado. Iniciando download...')
        // Usando o .shell() com showProgress=true para exibir apenas o percentual em cinza
        await this.shell(`curl -L -# -o ${this.config.model} ${this.config.modelUrl}`, true)
        Logger.success('Download concluído.')
      }

      // 3. Inicia o servidor
      const args = [
        'exec', '-i', this.config.containerName,
        '/app/llama-server',
        '--host', '0.0.0.0',
        '--port', this.config.port.toString(),
        '-m', this.config.model,
        '-c', '8192',
        '--n-gpu-layers', '0',
        '--threads', '4',
        '--no-mmap',
        '--mlock',
        '--jinja',
        '--flash-attn', 'on',
        '--temp', '0.7',
        '--top-p', '0.8',
        '--presence-penalty', '1.5'
      ]

      Logger.inProgress(`Iniciando llama-server...`)
      
      this.process = spawn('podman', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })

      return new Promise((resolve, reject) => {
        let resolved = false
        const handleData = (data) => {
          const output = data.toString()
          if (output.includes('HTTP server listening') || output.includes(`0.0.0.0:${this.config.port}`)) {
            if (!resolved) {
              resolved = true
              this.activateMonitor('llama-server')
              Logger.success(`Servidor online em http://${this.config.host}:${this.config.port}`)
              resolve()
            }
          }
        }

        this.process.stdout.on('data', handleData)
        this.process.stderr.on('data', handleData)

        this.process.on('exit', (code) => {
          if (!resolved) {
            this.isRunning = false
            reject(new Error(`Servidor encerrou com código ${code}`))
          }
        })

        setTimeout(() => {
          if (!resolved) reject(new Error('Timeout na inicialização.'))
        }, 60000)
      })

    } catch (error) {
      Logger.error(`Falha: ${error.message}`)
      this.isRunning = false
      throw error
    }
  }

  async stop() {
    Logger.info(`Parando servidor...`)
    await this.cleanupInternalProcesses('llama-server')
    await super.stop()
  }
}

export default Llama
