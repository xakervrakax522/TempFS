import Base from '../core/base.js'
import LlamaCLIInstance from '../instances/llama-cli.js'
import ConfigLoader from '../utils/config.js'

class LlamaCLIApp extends Base {
  constructor() {
    super()
    this.name = 'Llama CLI App'
    this.roles = ['base', 'llama']
    
    const config = ConfigLoader.getConfig()
    
    this.config = {
      model: `${config.model.path}/${config.model.name}`,
      modelUrl: config.model.url,
      containerName: config.container.name,
      persistent: true
    }
  }

  createContainer() {
    return new LlamaCLIInstance(this.config)
  }
}

const app = new LlamaCLIApp()
app.run()
