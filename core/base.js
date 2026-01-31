import * as terminal from '../terminal/index.js'
import Logger from '../utils/logger.js'

class Base {
  constructor() {
    this.isRunning = false
    this.container = null
    this.name = 'Base'
    this.roles = ['base'] // Role padrão para todas as instâncias
    this._isShuttingDown = false
  }

  async handleCommand(input) {
    const executed = await terminal.executeCommand(this, input)
    
    if (!executed) {
      const commands = terminal.getCommands(this)
      const available = commands.map(c => c.name).join(', ')
      Logger.warning(`Comando não encontrado. Comandos disponíveis: ${available}`)
    }
  }

  async init() {
    try {
      Logger.info(`Iniciando ${this.name}.`)
      
      // Carregar comandos do terminal
      await terminal.loadCommands()
      
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
    const commands = terminal.getCommands(this)
    
    commands.forEach(cmd => {
      if (Array.isArray(cmd.description)) {
        cmd.description.forEach((desc, index) => {
          const prefix = index === 0 ? cmd.name.padEnd(15) : `${cmd.name} ${desc.split(' - ')[0]}`.padEnd(15)
          const text = index === 0 ? desc : desc.split(' - ')[1] || desc
          
          if (index === 0) {
            Logger.info(`  ${cmd.name.padEnd(15)} - ${desc}`)
          } else {
            Logger.info(`  ${cmd.name} ${desc}`)
          }
        })
      } else {
        Logger.info(`  ${cmd.name.padEnd(15)} - ${cmd.description}`)
      }
    })
    console.log('') // Gambiarra pra quebra de linha kkk
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
        // Monitorado por utils/monitor.js
      }
    })
  }

  run() {
    this.setupSignals()
    this.init()
  }
}

export default Base
