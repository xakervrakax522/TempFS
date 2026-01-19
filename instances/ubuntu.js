import Container, { execAsync } from '../core/container.js'
import Logger from '../utils/logger.js'
import crypto from 'crypto'

class Ubuntu extends Container {
  constructor(config = {}) {
    const id = crypto.randomBytes(4).toString('hex')
    super({
      image: config.image || 'ubuntu:24.04',
      containerName: config.containerName || `ubuntu-${id}`,
      ...config
    })
    this.id = id
  }

  async pull() {
    Logger.inProgress(`Baixando imagem ${this.config.image}...`)
    try {
      await execAsync(`podman pull ${this.config.image}`)
      Logger.success(`Imagem ${this.config.image} pronta.`)
    } catch (error) {
      Logger.error(`Erro no pull: ${error.message}`)
      throw error
    }
  }

  async start() {
    Logger.inProgress(`Iniciando container ${this.config.containerName}...`)
    
    try {
      await execAsync(`podman rm -f ${this.config.containerName} 2>/dev/null || true`)
    } catch (e) {}

    const runCommand = `podman run --rm -d --replace \
      --name ${this.config.containerName} \
      --hostname ${this.config.containerName} \
      --tmpfs /root \
      --tmpfs /tmp \
      ${this.config.image} sleep infinity`

    try {
      await execAsync(runCommand)
      
      let ready = false
      for (let i = 0; i < 10; i++) {
        try {
          await execAsync(`podman inspect ${this.config.containerName}`)
          ready = true
          break
        } catch (e) {
          await new Promise(r => setTimeout(r, 500))
        }
      }

      if (!ready) throw new Error('Container não iniciou a tempo.')

      this.isRunning = true
      
      // Como não tem um processo específico, então passei null para processToKill
      this.activateMonitor(null)
      
      Logger.success(`Container ${this.config.containerName} online.`)
    } catch (error) {
      Logger.error(`Falha no start: ${error.message}`)
      throw error
    }
  }
}

export default Ubuntu
