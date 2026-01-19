import readline from 'readline'
import Logger from './logger.js'

export const TerminalState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  TRANSITIONING: 'TRANSITIONING',
  CLOSED: 'CLOSED'
}

let rl = null
let currentState = TerminalState.CLOSED

export function createTerminal(onCommand) {
  currentState = TerminalState.IDLE
  
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  })

  rl.on('line', async (line) => {
    const input = line.trim()
    
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
