import readline from 'readline'
import Logger from '../utils/logger.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const TerminalState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  TRANSITIONING: 'TRANSITIONING',
  CLOSED: 'CLOSED'
}

let rl = null
let currentState = TerminalState.CLOSED
const commands = new Map()

async function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true })
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name)
    return dirent.isDirectory() ? getFiles(res) : res
  }))
  return Array.prototype.concat(...files)
}

export async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands')
  const files = await getFiles(commandsPath)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  
  for (const file of jsFiles) {
    const relativePath = path.relative(commandsPath, file)
    const { default: cmd } = await import(`./commands/${relativePath}`)
    if (cmd && cmd.name) {
      commands.set(cmd.name, cmd)
      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          commands.set(alias, cmd)
        }
      }
    }
  }
  return commands
}

export function getCommands(instance) {
  const allCommands = Array.from(new Set(commands.values()))
  if (!instance) return allCommands
  
  return allCommands.filter(cmd => {
    // Se o comando não tem roles definidas, por segurança ninguem acessa hehe
    if (!cmd.roles || !Array.isArray(cmd.roles)) return false
    
    // Verifica se a instância tem pelo menos uma das roles do comando
    return cmd.roles.some(role => instance.roles.includes(role))
  })
}

export async function executeCommand(instance, input) {
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g
  const parts = []
  let match

  while ((match = regex.exec(input.trim())) !== null) {
    parts.push(match[1] || match[2] || match[0])
  }

  if (parts.length === 0) return false

  const commandName = parts[0].toLowerCase()
  const args = parts.slice(1)

  const command = commands.get(commandName)
  if (command) {
    const hasPermission = command.roles && 
       Array.isArray(command.roles) && 
       command.roles.some(role => instance.roles.includes(role))

    if (!hasPermission) {
      return false
    }
    
    await command.execute(instance, args)
    return true
  }
  return false
}

export function createTerminal(onCommand) {
  currentState = TerminalState.IDLE
  
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  })

  let accumulatedInput = ''

  rl.on('line', async (line) => {
    const trimmedLine = line.trimEnd()
    
    if (trimmedLine.endsWith('\\')) {
      accumulatedInput += line + '\n'
      rl.setPrompt('░ ')
      rl.prompt()
      return
    }

    accumulatedInput += line
    const input = accumulatedInput.trim()
    accumulatedInput = ''
    rl.setPrompt('> ')
    
    if (input) {
      currentState = TerminalState.RUNNING
      await onCommand(input)
      if (currentState === TerminalState.RUNNING) {
        currentState = TerminalState.IDLE
      }
    }
    
    if (rl && currentState === TerminalState.IDLE) {
      rl.prompt()
    }
  })

  rl.on('close', () => {
    if (currentState !== TerminalState.TRANSITIONING) {
      process.exit(0)
    }
    currentState = TerminalState.CLOSED
  })

  return rl
}

export function clearTerminal() {
  process.stdout.write('\x1Bc')
}

export function closeTerminal() {
  if (rl) {
    const tempRl = rl
    rl = null
    tempRl.close()
  }
}

export function setState(state) {
  if (Object.values(TerminalState).includes(state)) {
    currentState = state
  } else {
    Logger.error(`Estado inválido: ${state}`)
  }
}

export function getState() {
  return currentState
}

export function prompt() {
  if (rl && currentState === TerminalState.IDLE) {
    rl.prompt()
  }
}
