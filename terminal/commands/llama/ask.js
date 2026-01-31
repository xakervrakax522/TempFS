import Logger from '../../../utils/logger.js'
import ConfigLoader from '../../../utils/config.js'

export default {
  name: 'ask',
  aliases: ['ask'],
  description: [
    '<prompt> - Executa o llama-cli com o prompt fornecido'
  ],
  roles: ['base', 'llama'],
  async execute(instance, args) {
    const prompt = args.join(' ').trim()

    if (!prompt) {
      Logger.error('Você precisa fornecer um prompt.')
      return
    }

    const config = ConfigLoader.getConfig()
    const systemPrompt = config.system_prompt || "Você é um assistente útil."
    const modelPath = `${config.model.path}/${config.model.name}`

    const command = [
      './llama-cli',
      '-m', modelPath,
      '-sys', `'${systemPrompt.replace(/'/g, "'\\''")}'`,
      '-p', `'${prompt.replace(/'/g, "'\\''")}'`,
      '-st',
      '--no-display-prompt',
      '--no-show-timings',
      '-n 512',
      '-c 8192',
      '-t 4',
      '--temp 0.6',
      '--top-p 0.9',
      '--top-k 40',
      '--repeat-penalty 1.15',
      '--frequency-penalty 0.2',
      '--repeat-last-n 64',
      '--log-disable'
    ].join(' ')

    try {
      let captureStarted = false
      let preCaptureBuffer = ''
      let exitBuffer = ''
      const grayColor = '\x1b[90m'
      const resetColor = '\x1b[0m'
      const exitPattern = '\n\nExiting...\n\n> '

      await instance.container.shell(command, {
        onData: (data) => {
          if (!captureStarted) {
            preCaptureBuffer += data
            const promptMarker = `> ${prompt}`
            const promptIndex = preCaptureBuffer.indexOf(promptMarker)
            
            if (promptIndex !== -1) {
              captureStarted = true
              // Inicia a cor cinza imediatamente
              process.stdout.write(grayColor)
              
              let initialContent = preCaptureBuffer.substring(promptIndex + promptMarker.length)
              initialContent = initialContent.replace(/^[\r\n\s]+/, '')
              
              if (initialContent.length > 0) {
                // Se o conteúdo inicial já contiver parte do padrão de saída, tratamos
                if (initialContent.includes(exitPattern)) {
                  const parts = initialContent.split(exitPattern)
                  process.stdout.write(parts[0])
                  process.stdout.write(resetColor + '\n')
                  captureStarted = false
                } else {
                  process.stdout.write(initialContent)
                }
              }
              preCaptureBuffer = ''
            }
          } else {
            // Streaming ativo
            exitBuffer += data
            
            // Se o buffer de saída começar a parecer com o padrão de encerramento
            if (exitPattern.includes(exitBuffer) || exitBuffer.includes(exitPattern)) {
              if (exitBuffer.includes(exitPattern)) {
                const parts = exitBuffer.split(exitPattern)
                process.stdout.write(parts[0])
                process.stdout.write(resetColor + '\n')
                captureStarted = false
                exitBuffer = ''
              }
              // Se for apenas um prefixo do exitPattern, aguardamos o próximo chunk
            } else {
              // Não é o padrão de saída, descarrega o buffer e continua
              process.stdout.write(exitBuffer)
              exitBuffer = ''
            }
          }
        }
      })
      
      // Limpeza final caso o processo feche abruptamente
      if (captureStarted) {
        if (exitBuffer && !exitBuffer.includes('Exiting...')) {
          process.stdout.write(exitBuffer)
        }
        process.stdout.write(resetColor + '\n')
      }
    } catch (e) {
      Logger.error(`Erro ao executar llama-cli: ${e.message}`)
    }
  }
}
