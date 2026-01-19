const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  orange: '\x1b[38;5;208m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
}

class Logger {
  static print({ message, prefix = '', suffix = '', breakOnStart = true }) {
    if (typeof message !== 'string') {
      console.log(`${prefix}${message}${suffix}`)
      return
    }

    if (breakOnStart) {
      const match = message.match(/^(\s*)\n([\s\S]*)$/)
      if (match) {
        console.log(`\n${match[1]}${prefix}${match[2]}${suffix}`)
        return
      }
    }

    console.log(`${prefix}${message}${suffix}`)
  }

  static inProgress(message) {
    this.print({
      message,
      prefix: `${colors.blue}▌ `,
      suffix: colors.reset,
    })
  }

  static success(message) {
    this.print({
      message,
      prefix: `${colors.green}▌ [OK] `,
      suffix: colors.reset,
    })
  }

  static error(message) {
    this.print({
      message,
      prefix: `${colors.red}▌ [ERR] `,
      suffix: colors.reset,
    })
  }

  static warning(message) {
    this.print({
      message,
      prefix: `${colors.yellow}▌ `,
      suffix: colors.reset,
    })
  }

  static info(message) {
    this.print({
      message,
      prefix: `${colors.cyan}▌ [i] `,
      suffix: colors.reset,
    })
  }

  static output(message) {
    if (!message) return
    const formatted = message.trimEnd()
    console.log(`${colors.gray}${formatted}${colors.reset}`)
  }

  static status(message) {
    this.print({
      message,
      prefix: `\x1b[1m${colors.magenta}➔ `,
      suffix: colors.reset,
    })
  }

  static progress(message) {
    process.stdout.write(`\r${colors.gray}${message}${colors.reset}`)
  }
}

export default Logger
