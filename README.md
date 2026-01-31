# TempFS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) 
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Podman](https://img.shields.io/badge/Podman-22c5fb)](https://podman.io//)

![N|Solid](https://i.imgur.com/dytEofy.gif)

---

### O que é?

**TempFS** é um projeto que foi desenvolvido inicialmente como um prototipo para contêineres temporarios (`tempfs`) orquestrado para modelos GGUF usando [`llama-cpp`](https://github.com/ggml-org/llama.cpp).


> A ideia central é fazer com que modelos GGUF possam interagir em ambientes temproarios de forma eficiente e discreta.
> Pode notar que o contêiner ubuntu pode facilmente ser usado como playground para testes!

## A configuração é simples!

O script `llama-server.js` espera que um container `llama-cpp` esteja configurado e pronto para uso. Você pode criá-lo usando o seguinte comando Podman:

```shell
podman create \
  --name llama-cpp \
  --cpus=4 \
  --memory=6g \
  --memory-swap=7g \
  -v llama_models:/models \
  -p 8080:8080 \
  --entrypoint /bin/sh \
  ghcr.io/ggml-org/llama.cpp:full \
  -c "sleep infinity"
```

O volume `llama_models` será usado para armazenar o modelo GGUF (configurado em [`config.json`](/config.json)), que será baixado automaticamente na primeira execução do `llama-server.js`.

## Uso Prático

O projeto oferece **três exemplos** principais de ambientes na pasta [`EXEMPLOS/`](/EXEMPLOS):

### 1. Servidor Llama-CPP ([`llama-server.js`](/EXEMPLOS/llama-server.js))

Inicia o container `llama-cpp` (se não estiver rodando), baixa o modelo configurado (se necessário) e fornece um terminal interativo para interagir com o servidor llama.cpp.

```shell
node EXEMPLOS/llama-server.js
```

### 2. Llama CLI ([`llama-cli.js`](/EXEMPLOS/llama-cli.js))

Usa o `llama-cli` diretamente para interação básica com modelos GGUF. Este exemplo demonstra o uso direto da interface de linha de comando do llama.cpp.

```shell
node EXEMPLOS/llama-cli.js
```

### 3. Ambiente Ubuntu Efêmero ([`tempfs.js`](/EXEMPLOS/tempfs.js))

Cria um container temporário baseado em `ubuntu:24.04` na memória (tempfs). Este ambiente é **efêmero** e será completamente destruído ao ser encerrado.

```shell
node EXEMPLOS/tempfs.js
```

## Sistema de Comandos Customizáveis

O projeto agora suporta **comandos customizáveis** organizados por **roles**. Você pode criar seus próprios comandos seguindo a estrutura do exemplo [`ping.js`](/terminal/commands/tempfs/ping.js).

### Como criar um comando

1. Crie um arquivo `.js` na pasta apropriada dentro de [`terminal/commands/`](/terminal/commands/)
2. Defina as **roles** do comando para controlar quais containers podem usá-lo
3. Siga a estrutura do `ping.js` como base:

```javascript
export default {
  name: 'seu-comando',
  aliases: ['alias1', 'alias2'],
  description: 'Descrição do seu comando',
  roles: ['role1', 'role2'], // As roles permitem que containers decidam quais comandos usar
  async execute(args, container) {
    // Lógica do comando aqui
  }
}
```

### Roles de Comandos

As **roles** servem para que os containers decidam quais comandos ou grupos de comandos podem usar. Por exemplo:

- **`base`**: Comandos básicos disponíveis para todos (`bash`, `clear`, `exit`)
- **`ping`**: Comando de exemplo para o container TempFS
- **`llama`**: Comandos específicos para interação com llama.cpp

Ao criar seu container, defina as roles no construtor:

```javascript
this.roles = ['base', 'ping', 'sua-role-customizada']
```

### Comandos Interativos Padrão

Os comandos básicos estão disponíveis em todos os terminais:

| Comando | Descrição |
| :--- | :--- |
| `bash` | Entra no shell interativo do container. |
| `bash <comando>` | Executa um comando no container e retorna a saída. |
| `clear` | Limpa o terminal. |
| `exit` | Encerra o processo e limpa o container. |

### Melhorias no Parsing de Comandos

O sistema de comandos agora suporta:

- **Aspas**: Argumentos entre aspas são tratados como um único argumento
- **Quebra de linha com `\`**: Use `\` no final da linha para continuar o comando na próxima linha

Exemplo:
```shell
bash echo "Hello World" \
  && echo "Continuação do comando"
```

<details>
<summary><strong>Limpeza Automática (Processo Monitor)</strong></summary>

O projeto implementa um mecanismo de **Limpeza Automática** essencial para garantir que nenhum recurso fique órfão. Isso é feito através do [`utils/monitor.js`](/utils/monitor.js), que atua como um **"Processo Zumbi Reverso"**:

1.  **Monitoramento:** O [`monitor.js`](/utils/monitor.js) é iniciado como um processo filho *desanexado* (`detached: true`) do processo principal do Node.js.
2.  **Vigilância:** Ele monitora continuamente o PID do processo pai.
3.  **Limpeza Garantida:** Se o processo principal do Node.js morrer (seja por um `exit` normal, um erro não tratado, ou um sinal de interrupção como `Ctrl+C`), o monitor detecta a morte do pai e executa imediatamente os comandos `podman rm -f <container_name>` para garantir que o container associado seja **parado e removido**, limpando o ambiente e evitando containers órfãos.

Essa arquitetura garante que os ambientes efêmeros sejam realmente temporários.
</details>

<details>
<summary><strong>Nota sobre Dependências (npm podman, etc.)</strong></summary>
Você notará que este projeto **não utiliza** bibliotecas de terceiros (como `npm podman` ou SDKs) para interagir com o Podman. A comunicação é feita diretamente através da execução de comandos `podman` via `child_process`.

**Por quê?**

1.  **Minimalismo e Controle:** Evitar dependências externas reduz a complexidade e o *overhead* do projeto, dando controle total sobre os comandos executados.
2.  **Foco no Core:** O objetivo é simular um ambiente de agente que usa comandos de terminal, e a execução direta de comandos Podman é a forma mais fiel e robusta de alcançar isso.
3.  **Portabilidade:** Embora o foco seja Podman, a abordagem de linha de comando facilita a adaptação para Docker ou outras ferramentas de container, bastando trocar o prefixo do comando.
</details>

---

**Obrigado pela atenção!**
