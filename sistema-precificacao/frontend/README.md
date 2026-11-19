# Frontend: Simulador de Precificação RTC — Fábrica de Meias & Distribuição

Interface web interativa em **React + TypeScript + Tailwind CSS** desenvolvida para simular e analisar o ajuste de precificação industrial de uma **fábrica de meias** vendendo para **distribuidores**, integrada conceitualmente ao motor de cálculo da **Reforma Tributária do Consumo (IBS, CBS e IS — LC 214/2025)**.

---

## 🚀 Funcionalidades

1. **Simulador de Formação de Preço (Fábrica → Distribuidor)**:
   - Desoneração do custo de insumos (algodão, poliamida, elastano, energia) com aproveitamento dos créditos de entrada.
   - Cálculo do frete de distribuição líquido (frota própria vs. transportadora CT-e) e destaque do campo `vFrete`.
   - Formação do Preço Líquido e aplicação dos tributos **"por fora"** (CBS Federal + IBS Estadual + IBS Municipal do destino).
   - Visão B2B do distribuidor: aproveitamento de crédito integral e custo efetivo real de aquisição.
   - Demonstração do **Split Payment** automático no ato da liquidação financeira.
2. **Comparativo Fim do ICMS-ST**:
   - Comparação lado a lado entre o regime antigo (com ICMS-ST, MVA e trava de capital de giro) e o novo regime de não cumulatividade plena.
3. **Gerador de Payload para a API Serpro RTC**:
   - Gera o payload JSON idêntico ao exigido pelo endpoint `POST /api/calculadora/regime-geral` deste projeto.
4. **Guia Prático da Legislação**:
   - Regras do setor têxtil/vestuário (NCM 6115), princípio do destino, não incidência de Imposto Seletivo e cronograma 2026-2033.

---

## 🛠️ Como Executar

### Pré-requisitos
- Node.js versão 20+ instalada.
- Backend Java Spring Boot da Calculadora rodando na porta `8080` (opcional, para testes de integração).

### Passos:

```bash
# 1. Entrar na pasta do frontend
cd frontend

# 2. Instalar as dependências (já instaladas)
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse a aplicação no navegador em: `http://localhost:3000` ou `http://localhost:5173`.

### Build de Produção
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `frontend/dist/`.
