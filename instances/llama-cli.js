import Container, { execAsync } from '../core/container.js'
import Logger from '../utils/logger.js'

class LlamaCLIInstance extends Container {
  constructor(config = {}) {
    super({
      model: config.model || '',
      modelUrl: config.modelUrl || '',
      containerName: config.containerName || 'llama-cpp',
      persistent: true,
      ...config
    })
  }

  async start() {
    try {
      Logger.inProgress(`Preparando container ${this.config.containerName}...`)

      // 1. Tenta iniciar o container se ele existir
      try {
        await execAsync(`podman start ${this.config.containerName} 2>/dev/null || true`)
      } catch (error) {}

      this.isRunning = true

      // 2. Verifica e baixa o modelo
      try {
        Logger.info('Verificando modelo...')
        await this.shell(`ls ${this.config.model}`)
        Logger.success('Modelo encontrado.')
      } catch (e) {
        Logger.warning('Modelo não encontrado. Iniciando download...')
        await this.shell(`curl -L -# -o ${this.config.model} ${this.config.modelUrl}`, true)
        Logger.success('Download concluído.')
      }

      Logger.success('Ambiente CLI pronto.')
    } catch (error) {
      Logger.error(`Falha: ${error.message}`)
      this.isRunning = false
      throw error
    }
  }
}

export default LlamaCLIInstance
