import Logger from '../../../utils/logger.js'

export default {
  name: 'ping',
  aliases: [],
  description: 'Responde pong. Usado apenas para fim de exemplo no tempfs.js.',
  roles: ['ping'], // Coloque as roles que quiser, mas lembre-se de incluir nas configuraçẽos do conteiner.
  async execute() {
    Logger.output('pong')
  }
}
