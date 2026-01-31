import Logger from '../../../utils/logger.js'
import * as terminal from '../../index.js'

export default {
  name: 'bash',
  aliases: ['sh', 'shell'],
  description: [
    'Entra no bash do container',
    '<comando>  - Executa comando no container'
  ],
  roles: ['base', 'bash'],
  async execute(instance, args) {
    const command = args.map(arg => `'${arg.replace(/'/g, "'\\''")}'`).join(' ').trim()

    if (!command) {
      // Modo interativo
      terminal.setState(terminal.TerminalState.TRANSITIONING)
      terminal.closeTerminal()
      
      await instance.container.terminal()
      
      terminal.createTerminal(instance.handleCommand.bind(instance))
      terminal.prompt()
    } else {
      // Execução de comando unico
      try {
        const output = await instance.container.shell(command)
        if (output) {
          Logger.output(output)
        }
      } catch (e) {
        Logger.error(`Erro ao executar comando bash: ${e.message}`)
      }
    }
  }
}
