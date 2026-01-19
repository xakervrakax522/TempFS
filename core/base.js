import * as terminal from '../utils/terminal.js'
import Logger from '../utils/logger.js'

class Base {
  constructor() {
    this.isRunning = false
    this.container = null
    this.name = 'Base'
    this._isShuttingDown = false
  }

  async handleCommand(input) {
    const trimmed = input.trim()
    
    if (trimmed.toLowerCase() === 'exit') {
      await this.shutdown()
      return
    }
    
    if (trimmed.toLowerCase() === 'clear') {
      terminal.clearTerminal()
      return
    }
    
    if (trimmed.toLowerCase() === 'bash') {
      terminal.setState(terminal.TerminalState.TRANSITIONING)
      terminal.closeTerminal()
      
      await this.container.terminal()
      
      terminal.createTerminal(this.handleCommand.bind(this))
      terminal.prompt()
      return
    } else if (trimmed.toLowerCase().startsWith('bash ')) {
      const command = trimmed.slice(5).trim()
      
      if (!command) {
        Logger.warning('Uso: bash <comando> ou apenas bash para entrar no shell')
        return
      }
      
      try {
        const output = await this.container.shell(command)
        if (output) {
          Logger.output(output)
        }
      } catch (e) {
        Logger.error(`Erro: ${e.message}`)
      }
      return
    }
    
    Logger.warning('Comandos disponíveis: exit, clear, bash, bash <comando>')
  }

  async init() {
    try {
      Logger.info(`Iniciando ${this.name}.`)
      
      this.container = this.createContainer()
      await this.container.start()
      
      this.isRunning = true
      terminal.createTerminal(this.handleCommand.bind(this))
      
      this.welcomeMessage()
      
      terminal.prompt()
    } catch (error) {
      Logger.error(`Erro fatal: ${error.message}`)
      await this.shutdown()
      process.exit(1)
    }
  }

  createContainer() {
    throw new Error('Método createContainer deve ser implementado.')
  }

  welcomeMessage() {
    Logger.success(`Bem vindo ao ${this.name}!\n`)
    Logger.info('Comandos disponíveis:')
    Logger.info('  exit            - Encerra o sistema')
    Logger.info('  clear           - Limpa o console')
    Logger.info('  bash            - Entra no bash do container')
    Logger.info('  bash <comando>  - Executa comando no container\n')
  }

  async shutdown() {
    if (this._isShuttingDown) return
    this._isShuttingDown = true

    Logger.info('\nEncerrando e limpando recursos...')
    this.isRunning = false
    
    if (this.container) {
      await this.container.stop()
    }
    
    terminal.closeTerminal()
    process.exit(0)
  }

  setupSignals() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP']
    signals.forEach(signal => {
      process.on(signal, async () => {
        await this.shutdown()
      })
    })

    process.on('uncaughtException', async (err) => {
      Logger.error(`Erro não tratado: ${err.message}`)
      await this.shutdown()
    })

    process.on('unhandledRejection', async (reason) => {
      Logger.error(`Rejeição não tratada: ${reason}`)
      await this.shutdown()
    })

    process.on('exit', (code) => {
      if (code !== 0 && !this._isShuttingDown) {
        // Não precisa implementar graças a utils/monitor.js
      }
    })
  }

  run() {
    this.setupSignals()
    this.init()
  }
}

export default Base
