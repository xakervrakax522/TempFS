import Base from '../core/base.js'
import Ubuntu from '../instances/ubuntu.js'

class TempFSApp extends Base {
  constructor() {
    super()
    this.name = 'TempFS (Ubuntu)'
    this.roles = ['base', 'ping']
  }

  createContainer() {
    return new Ubuntu({
      image: 'ubuntu:24.04'
    })
  }
}

const app = new TempFSApp()
app.run()
