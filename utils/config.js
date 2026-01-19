import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ConfigLoader {
  constructor() {
    this.configPath = resolve(__dirname, '..', 'config.json')
  }

  getConfig() {
    try {
      const data = readFileSync(this.configPath, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      return null
    }
  }
}

export default new ConfigLoader()
