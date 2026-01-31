import { clearTerminal } from '../../index.js'

export default {
  name: 'clear',
  aliases: ['cls', 'clean'],
  description: 'Limpa o console',
  roles: ['base', 'clear'],
  async execute() {
    clearTerminal()
  }
}
