# Tutorial Completo: Como Usar o KnightBot-MD (Traduzido para PT-BR)

Bem-vindo ao KnightBot-MD! Este tutorial foi criado para ajudar você, mesmo que seja um iniciante, a configurar e usar este bot de WhatsApp incrível. Siga os passos abaixo para começar.

## 1. Pré-requisitos

Antes de começar, você precisará ter algumas ferramentas instaladas no seu computador:

*   **Node.js**: É o ambiente de execução JavaScript que o bot utiliza. Baixe e instale a versão LTS (Long Term Support) mais recente em [nodejs.org](https://nodejs.org/).
*   **Git**: É uma ferramenta para gerenciar versões de código. Baixe e instale em [git-scm.com](https://git-scm.com/).
*   **Conta do WhatsApp**: Você precisará de uma conta do WhatsApp para o bot usar.

## 2. Configuração do Bot

Siga estes passos para configurar o bot no seu computador:

### Passo 2.1: Baixar o Código do Bot

1.  Abra o **Terminal** (no Linux/macOS) ou **Prompt de Comando/PowerShell** (no Windows).
2.  Navegue até a pasta onde você deseja salvar o bot (ex: `cd C:\Users\SeuUsuario\Documents`).
3.  Clone o repositório do bot usando o Git:
    ```bash
    git clone https://github.com/josielsilva10/Knightbot-MD.git
    ```
4.  Entre na pasta do bot:
    ```bash
    cd Knightbot-MD
    ```

### Passo 2.2: Instalar as Dependências

Dentro da pasta `Knightbot-MD`, instale todas as bibliotecas necessárias:

```bash
npm install
```

### Passo 2.3: Configurar o Bot

1.  Abra o arquivo `config.js` na pasta `Knightbot-MD` com um editor de texto (como VS Code, Notepad++).
2.  Edite as informações conforme suas preferências. As principais são:
    *   `botName`: O nome do seu bot.
    *   `botOwner`: Seu nome ou o nome do proprietário do bot.
    *   `prefix`: O prefixo dos comandos (geralmente `.` ou `!`).

## 3. Iniciando o Bot

Para ligar o bot, execute o seguinte comando no Terminal/Prompt de Comando, dentro da pasta `Knightbot-MD`:

```bash
npm start
```

Na primeira vez que você iniciar o bot, ele irá gerar um código QR no terminal. Você precisará escanear este código QR com o seu celular (vá em WhatsApp > Aparelhos Conectados > Conectar um aparelho) para conectar o bot à sua conta do WhatsApp. Após escanear, o bot estará online!

## 4. Como Usar os Comandos

Para usar um comando, digite o prefixo (definido no `config.js`, geralmente `.`) seguido do nome do comando e, se necessário, os argumentos. Por exemplo, se o prefixo for `.`:

*   `.help` para ver a lista de comandos.
*   `.ping` para verificar se o bot está online.

## 5. Lista de Comandos

Abaixo está a lista completa de comandos disponíveis no KnightBot-MD:

### 🌐 Comandos Gerais:
*   `.help` ou `.menu`
*   `.ping`
*   `.alive`
*   `.tts <texto>`
*   `.owner`
*   `.joke`
*   `.quote`
*   `.fact`
*   `.weather <cidade>`
*   `.news`
*   `.attp <texto>`
*   `.lyrics <título_da_música>`
*   `.8ball <pergunta>`
*   `.groupinfo`
*   `.staff` ou `.admins`
*   `.vv`
*   `.trt <texto> <idioma>`
*   `.ss <link>`
*   `.jid`
*   `.url`

### 👮‍♂️ Comandos de Administrador:
*   `.ban @usuário`
*   `.promote @usuário`
*   `.demote @usuário`
*   `.mute <minutos>`
*   `.unmute`
*   `.delete` ou `.del`
*   `.kick @usuário`
*   `.warnings @usuário`
*   `.warn @usuário`
*   `.antilink`
*   `.antibadword`
*   `.clear`
*   `.tag <mensagem>`
*   `.tagall`
*   `.tagnotadmin`
*   `.hidetag <mensagem>`
*   `.chatbot`
*   `.resetlink`
*   `.antitag <on/off>`
*   `.welcome <on/off>`
*   `.goodbye <on/off>`
*   `.setgdesc <descrição>`
*   `.setgname <novo nome>`
*   `.setgpp (responder a imagem)`

### 🔒 Comandos do Dono:
*   `.mode <public/private>`
*   `.clearsession`
*   `.antidelete`
*   `.cleartmp`
*   `.update`
*   `.settings`
*   `.setpp <responder a imagem>`
*   `.autoreact <on/off>`
*   `.autostatus <on/off>`
*   `.autostatus react <on/off>`
*   `.autotyping <on/off>`
*   `.autoread <on/off>`
*   `.anticall <on/off>`
*   `.pmblocker <on/off/status>`
*   `.pmblocker setmsg <texto>`
*   `.setmention <responder a mensagem>`
*   `.mention <on/off>`

### 🎨 Comandos de Imagem/Figurinha:
*   `.blur <imagem>`
*   `.simage <responder a figurinha>`
*   `.sticker <responder a imagem>`
*   `.removebg`
*   `.remini`
*   `.crop <responder a imagem>`
*   `.tgsticker <Link>`
*   `.meme`
*   `.take <nome_do_pacote>`
*   `.emojimix <emj1>+<emj2>`
*   `.igs <link_insta>`
*   `.igsc <link_insta>`

### 🖼️ Comandos Pies:
*   `.pies <país>`
*   `.china`
*   `.indonesia`
*   `.japan`
*   `.korea`
*   `.hijab`

### 🎮 Comandos de Jogo:
*   `.tictactoe @usuário`
*   `.hangman`
*   `.guess <letra>`
*   `.trivia`
*   `.answer <resposta>`
*   `.truth`
*   `.dare`

### 🤖 Comandos de IA:
*   `.gpt <pergunta>`
*   `.gemini <pergunta>`
*   `.imagine <prompt>`
*   `.flux <prompt>`
*   `.sora <prompt>`

### 🎯 Comandos Divertidos:
*   `.compliment @usuário`
*   `.insult @usuário`
*   `.flirt`
*   `.shayari`
*   `.goodnight`
*   `.roseday`
*   `.character @usuário`
*   `.wasted @usuário`
*   `.ship @usuário`
*   `.simp @usuário`
*   `.stupid @usuário [texto]`

### 🔤 Criador de Texto:
*   `.metallic <texto>`
*   `.ice <texto>`
*   `.snow <texto>`
*   `.impressive <texto>`
*   `.matrix <texto>`
*   `.light <texto>`
*   `.neon <texto>`
*   `.devil <texto>`
*   `.purple <texto>`
*   `.thunder <texto>`
*   `.leaves <texto>`
*   `.1917 <texto>`
*   `.arena <texto>`
*   `.hacker <texto>`
*   `.sand <texto>`
*   `.blackpink <texto>`
*   `.glitch <texto>`
*   `.fire <texto>`

### 📥 Baixadores:
*   `.play <nome_da_música>`
*   `.song <nome_da_música>`
*   `.spotify <consulta>`
*   `.instagram <link>`
*   `.facebook <link>`
*   `.tiktok <link>`
*   `.video <nome_da_música>`
*   `.ytmp4 <Link>`

### 🧩 DIVERSOS:
*   `.heart`
*   `.horny`
*   `.circle`
*   `.lgbt`
*   `.lolice`
*   `.its-so-stupid`
*   `.namecard`
*   `.oogway`
*   `.tweet`
*   `.ytcomment`
*   `.comrade`
*   `.gay`
*   `.glass`
*   `.jail`
*   `.passed`
*   `.triggered`

### 🖼️ ANIME:
*   `.nom`
*   `.poke`
*   `.cry`
*   `.kiss`
*   `.pat`
*   `.hug`
*   `.wink`
*   `.facepalm`

### 💻 Comandos do Github:
*   `.git`
*   `.github`
*   `.sc`
*   `.script`
*   `.repo`

---

Esperamos que este tutorial ajude você a aproveitar ao máximo o KnightBot-MD! Se tiver alguma dúvida, consulte a documentação oficial ou a comunidade do bot.
