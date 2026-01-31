import Base from '../core/base.js'
import Llama from '../instances/llama-server.js'
import ConfigLoader from '../utils/config.js'

class LlamaApp extends Base {
  constructor() {
    super()
    this.name = 'Llama Server'
    this.roles = ['bash', 'clear', 'exit']
    
    const config = ConfigLoader.getConfig() || {
      model: {
        name: 'qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
        url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
        path: '/models'
      },
      server: { host: '0.0.0.0', port: 8080 },
      container: { name: 'llama-cpp' }
    }
    
    this.config = {
      model: `${config.model.path}/${config.model.name}`,
      modelUrl: config.model.url,
      host: config.server.host,
      port: config.server.port,
      containerName: config.container.name
    }
  }

  createContainer() {
    return new Llama(this.config)
  }
}

const app = new LlamaApp()
app.run()
