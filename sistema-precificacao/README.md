# Sistema de Precificação e Análise RTC — Fábrica de Meias & Distribuição

Módulo independente e desacoplado desenvolvido para simulação de formação de preço industrial, análise logística de frete e comparativo da transição tributária (**Reforma Tributária LC 214/2025 e Foco no Marco de 2027**).

---

## 📁 Estrutura Isolada do Módulo

Toda a solução da empresa está estritamente contida nesta pasta, **sem modificar nenhum arquivo da base oficial da Receita Federal / Serpro**:

```
calculadora-rtc-regime-regular/
├── flyway/                     # (Original Serpro - Intocado)
├── src/                        # (Original Serpro - Intocado)
├── docs/                       # (Original Serpro - Intocado)
├── pom.xml                     # (Original Serpro - Intocado)
│
└── sistema-precificacao/       # 🚀 NOSSO MÓDULO (100% ISOLADO)
    ├── frontend/               # Aplicação Web em React + TypeScript + Tailwind
    │   ├── src/
    │   │   ├── App.tsx         # Dashboard com seletor 2026/2027/2033
    │   │   └── ...
    │   ├── package.json
    │   └── vite.config.ts
    ├── media/                  # Vídeos explicativos gerados
    │   ├── demo-video.mp4      # Demonstração Desktop (16:9 c/ áudio)
    │   └── demo-tiktok-2027.mp4# Demonstração Vertical TikTok (9:16 c/ áudio)
    ├── scripts/                # Automações de gravação e TTS
    │   ├── record-demo.cjs
    │   ├── record-tiktok.cjs
    │   ├── build_audio.ps1
    │   └── build_tiktok_audio.ps1
    ├── iniciar.bat             # Atalho de inicialização rápida
    ├── .gitignore              # Protege node_modules e arquivos temporários
    └── README.md               # Esta documentação
```

---

## 🚀 Como Executar o Sistema

### 1. Iniciar o Frontend React
Você pode clicar duas vezes em `iniciar.bat` ou executar via terminal:
```bash
cd sistema-precificacao/frontend
npm run dev
```
Acesse no navegador: `http://localhost:3000` (ou porta indicada no terminal).

### 2. Iniciar o Backend Serpro RTC (Opcional - para chamadas da API)
A partir da raiz do repositório:
```bash
# Windows
mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=offline"
```
O backend ficará disponível em `http://localhost:8080/api/calculadora`.

---

## 📤 Como Fazer a Subida para o Git da Sua Empresa

Como o módulo está completamente isolado dentro de `sistema-precificacao/`, você pode subir suas alterações sem interferir no histórico da Receita Federal.

### Passo 1: Adicionar apenas o nosso módulo
```bash
git add sistema-precificacao/
```

### Passo 2: Criar o commit
```bash
git commit -m "feat: adiciona sistema de precificacao e analise rtc 2027 para fabrica de meias"
```

### Passo 3: Enviar para o seu repositório remoto
```bash
# Se estiver trabalhando na branch main do seu fork:
git push origin main

# Ou se preferir criar uma branch dedicada para a empresa:
git checkout -b feature/sistema-precificacao
git push -u origin feature/sistema-precificacao
```

---

## 🔄 Como Atualizar a Calculadora da Receita Federal no Futuro

Para puxar novas atualizações publicadas pela Receita Federal sem nenhum conflito de código:

1. Configure o repositório oficial como `upstream` (se ainda não configurado):
   ```bash
   git remote add upstream https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git
   ```

2. Para sincronizar as novidades da Receita:
   ```bash
   git fetch upstream
   git merge upstream/main
   git push origin main
   ```
Como você não alterou nenhuma linha dos diretórios `src/`, `flyway/` ou `pom.xml`, o merge ocorrerá de forma **100% limpa e automática**.
