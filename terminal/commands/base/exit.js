import Logger from '../../../utils/logger.js'

export default {
  name: 'exit',
  aliases: ['quit', 'bye'],
  description: 'Encerra o sistema',
  roles: ['base', 'exit'],
  async execute(instance) {
    await instance.shutdown()
  }
}
