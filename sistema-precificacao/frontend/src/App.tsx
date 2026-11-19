import React, { useState, useMemo } from 'react'
import {
  Calculator,
  Truck,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  FileCode,
  BookOpen,
  DollarSign,
  Boxes,
  HelpCircle,
  Copy,
  Check,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react'

// Dados padrão por estado para simulação de IBS (Estadual + Municipal estimado)
const ESTADOS_ALIQUOTAS: Record<string, { nome: string; ibsUf: number; ibsMun: number; icmsPadrao: number }> = {
  SP: { nome: 'São Paulo', ibsUf: 12.0, ibsMun: 3.5, icmsPadrao: 18.0 },
  RJ: { nome: 'Rio de Janeiro', ibsUf: 12.5, ibsMun: 3.5, icmsPadrao: 20.0 },
  MG: { nome: 'Minas Gerais', ibsUf: 12.0, ibsMun: 3.0, icmsPadrao: 18.0 },
  PR: { nome: 'Paraná', ibsUf: 11.5, ibsMun: 3.5, icmsPadrao: 19.5 },
  SC: { nome: 'Santa Catarina', ibsUf: 11.0, ibsMun: 3.5, icmsPadrao: 17.0 },
  RS: { nome: 'Rio Grande do Sul', ibsUf: 12.0, ibsMun: 3.5, icmsPadrao: 17.0 },
  BA: { nome: 'Bahia', ibsUf: 12.5, ibsMun: 3.0, icmsPadrao: 20.5 },
  PE: { nome: 'Pernambuco', ibsUf: 12.5, ibsMun: 3.0, icmsPadrao: 20.5 },
  CE: { nome: 'Ceará', ibsUf: 12.0, ibsMun: 3.5, icmsPadrao: 20.0 },
  GO: { nome: 'Goiás', ibsUf: 11.5, ibsMun: 3.5, icmsPadrao: 19.0 },
  DF: { nome: 'Distrito Federal', ibsUf: 12.0, ibsMun: 3.0, icmsPadrao: 20.0 },
  AM: { nome: 'Amazonas', ibsUf: 11.0, ibsMun: 3.0, icmsPadrao: 20.0 },
  PA: { nome: 'Pará', ibsUf: 12.0, ibsMun: 3.0, icmsPadrao: 19.0 },
}

const PRODUTOS_MEIAS = [
  { id: 'soquete-algodao', nome: 'Meia Soquete Algodão (Cano Curto)', ncm: '61159600', custoInsumoPadrao: 2.10, pesoParKg: 0.04 },
  { id: 'esportiva-atoalhada', nome: 'Meia Esportiva Atoalhada', ncm: '61159500', custoInsumoPadrao: 2.80, pesoParKg: 0.06 },
  { id: 'social-fina', nome: 'Meia Social Poliamida Fina', ncm: '61159600', custoInsumoPadrao: 3.20, pesoParKg: 0.03 },
  { id: 'invisivel', nome: 'Meia Invisível c/ Silicone', ncm: '61159600', custoInsumoPadrao: 2.40, pesoParKg: 0.035 },
  { id: 'termica-inverno', nome: 'Meia Térmica Felpada de Inverno', ncm: '61159900', custoInsumoPadrao: 4.50, pesoParKg: 0.09 },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<'precificacao' | 'comparativo2027' | 'api-rtc' | 'legislacao'>('precificacao')

  // ANO VIGENTE DA REFORMA TRIBUTÁRIA
  // 2026: Piloto de teste (PIS/COFINS ativos, CBS teste 0.9%, IBS teste 0.1%)
  // 2027: A VIRADA FEDERAL (PIS/COFINS EXTINTOS, CBS plena 8.8%, IBS teste 0.1% compensável, ICMS ativo)
  // 2033: REFORMA PLENA (PIS/COFINS/ICMS/ISS extintos, CBS 8.8%, IBS pleno ~17.7%)
  const [anoVigencia, setAnoVigencia] = useState<2026 | 2027 | 2033>(2027)

  // Entradas da Fábrica
  const [produtoSelecionado, setProdutoSelecionado] = useState(PRODUTOS_MEIAS[0].id)
  const [quantidadePares, setQuantidadePares] = useState(2400) // 200 dúzias
  const [custoMateriaPrima, setCustoMateriaPrima] = useState(2.10) // R$ por par
  const [custosFixosFabrica, setCustosFixosFabrica] = useState(0.85) // R$ por par
  const [margemLucroPercent, setMargemLucroPercent] = useState(22) // % margem líquida

  // Distribuição / Frete
  const [tipoFrete, setTipoFrete] = useState<'propria' | 'terceirizada'>('propria')
  const [valorFreteTotal, setValorFreteTotal] = useState(650.00) // R$ total do frete do lote
  const [destacarFreteSeparado, setDestacarFreteSeparado] = useState(true)

  // Localização do Destino e Alíquotas
  const [ufDestino, setUfDestino] = useState('SP')

  // Perfil do Distribuidor
  const [perfilDistribuidor, setPerfilDistribuidor] = useState<'regime_geral' | 'simples_nacional'>('regime_geral')
  const [margemRevendaDistribuidor, setMargemRevendaDistribuidor] = useState(30) // %

  // Estado do botão de copiar
  const [copiedJson, setCopiedJson] = useState(false)

  // Configuração Fiscal Dinâmica por Ano de Vigência
  const configFiscalAno = useMemo(() => {
    const estadoInfo = ESTADOS_ALIQUOTAS[ufDestino] || ESTADOS_ALIQUOTAS['SP']
    
    if (anoVigencia === 2026) {
      return {
        titulo: '2026 — Ano Piloto de Testes',
        descricao: 'CBS e IBS em alíquota teste simbólica. PIS, COFINS e ICMS continuam 100% ativos.',
        pisCofinsAtivo: true,
        aliquotaPisCofins: 9.25, // 1,65% + 7,60%
        cbsAtiva: true,
        aliquotaCBS: 0.90, // Alíquota teste 2026
        ibsModo: 'teste',
        aliquotaIBSEstadual: 0.05,
        aliquotaIBSMunicipal: 0.05,
        aliquotaIBSTotal: 0.10,
        icmsAtivo: true,
        aliquotaICMS: estadoInfo.icmsPadrao,
        stAtiva: true,
        aliquotasNominaisObrigatorias: false
      }
    } else if (anoVigencia === 2027) {
      // O ANO DA VIRADA FEDERAL!
      return {
        titulo: '2027 — A Virada Federal da CBS',
        descricao: 'PIS e COFINS EXTINTOS! CBS entra 100% plena (8,8%). IBS segue em teste (0,1%) compensável com ICMS.',
        pisCofinsAtivo: false, // EXTINTO!
        aliquotaPisCofins: 0.0,
        cbsAtiva: true,
        aliquotaCBS: 8.80, // CBS PLENA!
        ibsModo: 'teste',
        aliquotaIBSEstadual: 0.05, // Segue teste até 2028
        aliquotaIBSMunicipal: 0.05,
        aliquotaIBSTotal: 0.10,
        icmsAtivo: true, // ICMS AINDA EXISTE EM 2027 (redução só em 2029)
        aliquotaICMS: estadoInfo.icmsPadrao,
        stAtiva: true, // ICMS-ST ainda existe na parcela estadual
        aliquotasNominaisObrigatorias: true // Obrigatório na API Serpro RTC
      }
    } else {
      // 2033+: REFORMA PLENA
      return {
        titulo: '2033 — Regime RTC Definitivo',
        descricao: 'Extinção completa do ICMS, ISS e ICMS-ST. Somente CBS Federal e IBS Pleno do destino.',
        pisCofinsAtivo: false,
        aliquotaPisCofins: 0.0,
        cbsAtiva: true,
        aliquotaCBS: 8.80,
        ibsModo: 'pleno',
        aliquotaIBSEstadual: estadoInfo.ibsUf,
        aliquotaIBSMunicipal: estadoInfo.ibsMun,
        aliquotaIBSTotal: estadoInfo.ibsUf + estadoInfo.ibsMun,
        icmsAtivo: false, // EXTINTO!
        aliquotaICMS: 0.0,
        stAtiva: false, // FIM DA ST!
        aliquotasNominaisObrigatorias: true
      }
    }
  }, [anoVigencia, ufDestino])

  // --- CÁLCULOS MATEMÁTICOS EM TEMPO REAL ---
  const calculos = useMemo(() => {
    const estadoInfo = ESTADOS_ALIQUOTAS[ufDestino] || ESTADOS_ALIQUOTAS['SP']
    const cfg = configFiscalAno

    // 1. Desoneração dos Insumos da Fábrica
    // Em 2027: ganha crédito de CBS plena (8.8%) + ICMS (18%), sem PIS/COFINS
    let taxaCreditoInsumos = 0.265
    if (anoVigencia === 2026) taxaCreditoInsumos = 0.2725 // PIS/COFINS 9.25% + ICMS 18%
    if (anoVigencia === 2027) taxaCreditoInsumos = (cfg.aliquotaCBS + cfg.aliquotaICMS) / 100 // 8.8% + 18% = 26.8%
    if (anoVigencia === 2033) taxaCreditoInsumos = (cfg.aliquotaCBS + cfg.aliquotaIBSTotal) / 100

    const creditoInsumosPorPar = custoMateriaPrima * taxaCreditoInsumos
    const custoInsumoLiquidoPorPar = custoMateriaPrima - creditoInsumosPorPar
    const custoIndustrialLiquidoUnit = custoInsumoLiquidoPorPar + custosFixosFabrica
    const custoIndustrialLiquidoTotal = custoIndustrialLiquidoUnit * quantidadePares

    // 2. Frete Líquido
    const creditoFreteTotal = valorFreteTotal * taxaCreditoInsumos
    const freteLiquidoTotal = valorFreteTotal - creditoFreteTotal
    const freteLiquidoPorPar = freteLiquidoTotal / quantidadePares

    // 3. Preço Líquido de Venda da Fábrica (Pliq)
    const margemFator = 1 - (margemLucroPercent / 100)
    const precoLiquidoTotalSemFrete = custoIndustrialLiquidoTotal / (margemFator > 0 ? margemFator : 1)
    const precoLiquidoPorParSemFrete = precoLiquidoTotalSemFrete / quantidadePares
    const precoLiquidoTotalComFrete = precoLiquidoTotalSemFrete + freteLiquidoTotal

    // 4. Base de Cálculo da Operação
    const vProdBase = destacarFreteSeparado ? precoLiquidoTotalSemFrete : precoLiquidoTotalComFrete
    const vFreteBase = destacarFreteSeparado ? freteLiquidoTotal : 0
    const baseCalculoTotal = vProdBase + vFreteBase

    // 5. Apuração dos Tributos por Ano de Vigência
    // PIS e COFINS (se ativos em 2026)
    const valorPisCofins = cfg.pisCofinsAtivo ? baseCalculoTotal * (cfg.aliquotaPisCofins / 100) : 0
    
    // CBS (Federal)
    const valorCBS = cfg.cbsAtiva ? baseCalculoTotal * (cfg.aliquotaCBS / 100) : 0

    // IBS (Estadual + Municipal)
    const valorIBS_UF = baseCalculoTotal * (cfg.aliquotaIBSEstadual / 100)
    const valorIBS_Mun = baseCalculoTotal * (cfg.aliquotaIBSMunicipal / 100)
    const valorIBS_Total = valorIBS_UF + valorIBS_Mun

    // ICMS Estadual (se ativo em 2026/2027)
    // Em 2027, o IBS pago (0,10%) é compensável contra o ICMS
    const valorICMS_Bruto = cfg.icmsAtivo ? baseCalculoTotal * (cfg.aliquotaICMS / 100) : 0
    const valorICMS_Efetivo = Math.max(0, valorICMS_Bruto - (anoVigencia === 2027 ? valorIBS_Total : 0))

    // Total de Tributos RTC destacados "Por Fora"
    const totalTributosRTC = valorCBS + valorIBS_Total

    // Total da Fatura / NF-e
    // Em 2027: Base + CBS + IBS + ICMS transitório
    let valorTotalNFe = baseCalculoTotal + totalTributosRTC
    if (cfg.icmsAtivo && anoVigencia !== 2033) {
      // No modelo de transição 2027, o ICMS integra o preço ao distribuidor
      valorTotalNFe += valorICMS_Efetivo
    }
    const precoBrutoPorParNFe = valorTotalNFe / quantidadePares

    // 6. Visão do Distribuidor (Créditos Fiscais Recuperados)
    // Em 2027, o distribuidor recupera 100% da CBS (8,8%) + 100% do ICMS (18%) + IBS (0,1%)
    let creditoApropriadoDistribuidor = 0
    if (perfilDistribuidor === 'regime_geral') {
      if (anoVigencia === 2027) {
        creditoApropriadoDistribuidor = valorCBS + valorIBS_Total + valorICMS_Efetivo
      } else if (anoVigencia === 2026) {
        creditoApropriadoDistribuidor = valorPisCofins + valorICMS_Bruto
      } else {
        creditoApropriadoDistribuidor = totalTributosRTC
      }
    }
    const custoEfetivoAquisicaoDistribuidor = valorTotalNFe - creditoApropriadoDistribuidor
    const custoEfetivoPorParDistribuidor = custoEfetivoAquisicaoDistribuidor / quantidadePares

    // 7. Comparativo Especifico: O Impacto da Virada 2027 vs 2026
    const pisCofinsEliminado2027 = baseCalculoTotal * 0.0925 // 9,25% que sumiu em 2027!
    const cbsNova2027 = baseCalculoTotal * 0.088 // 8,80% que entrou por fora
    const saldoFederal2027 = pisCofinsEliminado2027 - cbsNova2027 // Alívio nominal federal

    return {
      custoInsumoLiquidoPorPar,
      custoIndustrialLiquidoUnit,
      custoIndustrialLiquidoTotal,
      freteLiquidoTotal,
      freteLiquidoPorPar,
      precoLiquidoTotalSemFrete,
      precoLiquidoPorParSemFrete,
      precoLiquidoTotalComFrete,
      vProdBase,
      vFreteBase,
      baseCalculoTotal,
      valorPisCofins,
      valorCBS,
      valorIBS_UF,
      valorIBS_Mun,
      valorIBS_Total,
      valorICMS_Efetivo,
      totalTributosRTC,
      valorTotalNFe,
      precoBrutoPorParNFe,
      creditoApropriadoDistribuidor,
      custoEfetivoAquisicaoDistribuidor,
      custoEfetivoPorParDistribuidor,
      pisCofinsEliminado2027,
      cbsNova2027,
      saldoFederal2027
    }
  }, [
    anoVigencia,
    ufDestino,
    configFiscalAno,
    produtoSelecionado,
    quantidadePares,
    custoMateriaPrima,
    custosFixosFabrica,
    margemLucroPercent,
    valorFreteTotal,
    destacarFreteSeparado,
    perfilDistribuidor
  ])

  // Formatação de Moeda
  const fmt = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  // Payload da API Serpro RTC configurado para a data selecionada
  const rtcApiPayload = useMemo(() => {
    const prod = PRODUTOS_MEIAS.find(p => p.id === produtoSelecionado) || PRODUTOS_MEIAS[0]
    const cfg = configFiscalAno
    const dataFatoGerador = `${anoVigencia}-04-15T10:00:00-03:00`

    const item: any = {
      numero: 1,
      ncm: prod.ncm,
      cst: "000",
      cClassTrib: "000001",
      quantidade: quantidadePares,
      unidade: "PAR",
      baseCalculo: Number(calculos.baseCalculoTotal.toFixed(2)),
      gComponentesBC: {
        vProd: Number(calculos.vProdBase.toFixed(2)),
        vFrete: Number(calculos.vFreteBase.toFixed(2)),
        vSeg: 0.00,
        vOutro: 0.00,
        vDesc: 0.00
      }
    }

    // A partir de 2027, aliquotasNominais é OBRIGATÓRIO na API Serpro RTC
    if (anoVigencia >= 2027) {
      item.aliquotasNominais = {
        cbs: cfg.aliquotaCBS,
        ibsEstadual: cfg.aliquotaIBSEstadual,
        ibsMunicipal: cfg.aliquotaIBSMunicipal
      }
    }

    return {
      id: `operacao-meias-${anoVigencia}-` + Date.now().toString(16),
      versao: "1.0.0",
      dhFatoGerador: dataFatoGerador,
      uf: ufDestino,
      municipio: ufDestino === 'SP' ? 3550308 : 4106902,
      itens: [item]
    }
  }, [produtoSelecionado, quantidadePares, calculos, ufDestino, anoVigencia, configFiscalAno])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(rtcApiPayload, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  RTC Preço Fácil <span className="text-indigo-400 font-semibold">— Fábrica de Meias</span>
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  LC 214/2025
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ajuste de Precificação Industrial, Logística de Distribuição e Motor Serpro RTC
              </p>
            </div>
          </div>

          {/* SELETOR DE VIGÊNCIA TRIBUTÁRIA (2026 vs 2027 vs 2033) */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Ano Base:
            </span>

            <button
              type="button"
              onClick={() => setAnoVigencia(2026)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                anoVigencia === 2026
                  ? 'bg-slate-700 text-slate-200 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2026 (Piloto)
            </button>

            <button
              type="button"
              onClick={() => setAnoVigencia(2027)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all relative flex items-center gap-1 ${
                anoVigencia === 2027
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400'
                  : 'text-indigo-300 hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              2027 (A Virada)
            </button>

            <button
              type="button"
              onClick={() => setAnoVigencia(2033)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                anoVigencia === 2033
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2033 (Pleno)
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-800/80 text-sm">
          <button
            onClick={() => setActiveTab('precificacao')}
            className={`px-4 py-2.5 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'precificacao'
                ? 'border-indigo-400 text-indigo-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Simulador Fábrica &rarr; Distribuidor
          </button>
          <button
            onClick={() => setActiveTab('comparativo2027')}
            className={`px-4 py-2.5 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'comparativo2027'
                ? 'border-indigo-400 text-indigo-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Diferenças Tributárias em 2027
          </button>
          <button
            onClick={() => setActiveTab('api-rtc')}
            className={`px-4 py-2.5 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'api-rtc'
                ? 'border-indigo-400 text-indigo-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Payload API Serpro RTC
          </button>
          <button
            onClick={() => setActiveTab('legislacao')}
            className={`px-4 py-2.5 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'legislacao'
                ? 'border-indigo-400 text-indigo-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Regras Têxtil / Frete
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* BANNER INFORMATIVO DO ANO SELECIONADO */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
          anoVigencia === 2027
            ? 'bg-indigo-900/10 border-indigo-300 text-indigo-950'
            : anoVigencia === 2026
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white font-bold ${
              anoVigencia === 2027 ? 'bg-indigo-600' : anoVigencia === 2026 ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              {anoVigencia}
            </div>
            <div>
              <div className="font-bold text-sm">{configFiscalAno.titulo}</div>
              <p className="text-slate-600 mt-0.5">{configFiscalAno.descricao}</p>
            </div>
          </div>

          {anoVigencia === 2027 && (
            <div className="hidden md:flex items-center gap-3 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-sm font-mono text-[11px]">
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">PIS / COFINS</span>
                <span className="font-bold text-red-600 line-through">9,25% (Extinto)</span>
              </div>
              <span className="text-slate-300">&rarr;</span>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">CBS Federal</span>
                <span className="font-bold text-emerald-600">8,80% (Plena)</span>
              </div>
              <span className="text-slate-300">+</span>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">IBS Teste</span>
                <span className="font-bold text-indigo-600">0,10% (Compensável)</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= TAB 1: SIMULADOR ================= */}
        {activeTab === 'precificacao' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Painel Esquerdo: Entradas da Fábrica (5 colunas) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Card 1: Produto e Lote */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3 text-sm">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  1. Produto e Volume da Fábrica
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Linha de Meias</label>
                    <select
                      value={produtoSelecionado}
                      onChange={(e) => {
                        setProdutoSelecionado(e.target.value)
                        const p = PRODUTOS_MEIAS.find(item => item.id === e.target.value)
                        if (p) setCustoMateriaPrima(p.custoInsumoPadrao)
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      {PRODUTOS_MEIAS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (NCM: {p.ncm})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Volume do Lote (Pares)</label>
                      <input
                        type="number"
                        min="12"
                        step="12"
                        value={quantidadePares}
                        onChange={(e) => setQuantidadePares(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                      />
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                        {(quantidadePares / 12).toFixed(0)} dúzias
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Insumos Brutos (R$/par)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={custoMateriaPrima}
                        onChange={(e) => setCustoMateriaPrima(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                      />
                      <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                        Crédito recuperado: {fmt(custoMateriaPrima * (anoVigencia === 2027 ? 0.268 : 0.265))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Custos Fabris (R$/par)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={custosFixosFabrica}
                        onChange={(e) => setCustosFixosFabrica(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">Energia, mão de obra</span>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Margem Líquida Fábrica</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={margemLucroPercent}
                          onChange={(e) => setMargemLucroPercent(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <span className="font-mono font-bold text-indigo-600 w-10 text-right">{margemLucroPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Logística e Distribuição (Frete) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3 text-sm">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  2. Distribuição & Frete (CIF)
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTipoFrete('propria')}
                      className={`py-1.5 rounded-md font-medium text-center transition-all ${
                        tipoFrete === 'propria' ? 'bg-white shadow text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      Frota Própria
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoFrete('terceirizada')}
                      className={`py-1.5 rounded-md font-medium text-center transition-all ${
                        tipoFrete === 'terceirizada' ? 'bg-white shadow text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      Transportadora (CT-e)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Valor do Frete no Lote (R$)</label>
                      <input
                        type="number"
                        step="10"
                        value={valorFreteTotal}
                        onChange={(e) => setValorFreteTotal(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {fmt(calculos.freteLiquidoPorPar)} / par
                      </span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="text-[11px] text-slate-600 font-medium flex items-center gap-2 cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={destacarFreteSeparado}
                          onChange={(e) => setDestacarFreteSeparado(e.target.checked)}
                          className="accent-indigo-600 rounded"
                        />
                        Destacar campo vFrete na NF-e
                      </label>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {anoVigencia === 2027 ? 'Soma na base da CBS plena (8,8%)' : 'Soma na base do IBS/CBS'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Destino do Distribuidor */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3 text-sm">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  3. Destino do Distribuidor ({ufDestino})
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Estado (UF) de Entrega</label>
                    <select
                      value={ufDestino}
                      onChange={(e) => setUfDestino(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800"
                    >
                      {Object.entries(ESTADOS_ALIQUOTAS).map(([uf, info]) => (
                        <option key={uf} value={uf}>
                          {uf} — {info.nome} (ICMS: {info.icmsPadrao}% | IBS Pleno: {info.ibsUf + info.ibsMun}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Perfil Tributário do Distribuidor</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPerfilDistribuidor('regime_geral')}
                        className={`p-2 rounded-lg text-left border text-xs font-medium transition-all ${
                          perfilDistribuidor === 'regime_geral'
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Regime Geral</div>
                        <div className="text-[10px] text-indigo-700">Toma 100% crédito</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPerfilDistribuidor('simples_nacional')}
                        className={`p-2 rounded-lg text-left border text-xs font-medium transition-all ${
                          perfilDistribuidor === 'simples_nacional'
                            ? 'bg-amber-50 border-amber-400 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">Simples / MEI</div>
                        <div className="text-[10px] text-amber-700">Sem crédito amplo</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Painel Direito: Resultados Financeiros e Faturamento 2027 (7 colunas) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Card Destaque: Faturamento da Fábrica e Nota Fiscal */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                        Valor Total da NF-e (Vigência {anoVigencia})
                      </span>
                      {anoVigencia === 2027 && (
                        <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          CBS 8,8% + ICMS 18%
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-white mt-0.5">
                      {fmt(calculos.valorTotalNFe)}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Preço Faturado por Par</span>
                    <span className="text-xl font-bold text-indigo-300 font-mono">
                      {fmt(calculos.precoBrutoPorParNFe)} <span className="text-xs font-normal text-slate-400">/ par</span>
                    </span>
                  </div>
                </div>

                {/* Grid de quebra de valores */}
                <div className="grid grid-cols-3 gap-3 my-4 text-xs">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[11px]">Preço Líquido (vProd)</span>
                    <span className="font-bold text-white text-sm font-mono">{fmt(calculos.vProdBase)}</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">{fmt(calculos.precoLiquidoPorParSemFrete)}/par</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[11px]">Frete Cobrado (vFrete)</span>
                    <span className="font-bold text-white text-sm font-mono">{fmt(calculos.vFreteBase)}</span>
                    <span className="text-[10px] text-indigo-300 block mt-0.5">{fmt(calculos.freteLiquidoPorPar)}/par</span>
                  </div>
                  <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                    <span className="text-indigo-200 block text-[11px]">
                      {anoVigencia === 2027 ? 'CBS + IBS 2027' : 'Tributos RTC'}
                    </span>
                    <span className="font-bold text-indigo-300 text-sm font-mono">{fmt(calculos.totalTributosRTC)}</span>
                    <span className="text-[10px] text-indigo-300 block mt-0.5">
                      {anoVigencia === 2027 ? '8,80% CBS + 0,10% IBS' : 'Tributos destacados'}
                    </span>
                  </div>
                </div>

                {/* Detalhamento Tributário Exclusivo do Ano Selecionado */}
                <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-slate-300 pb-1.5 border-b border-slate-800">
                    <span>Base de Cálculo Unificada (vProd + vFrete):</span>
                    <span className="font-bold text-white">{fmt(calculos.baseCalculoTotal)}</span>
                  </div>

                  {/* PIS / COFINS */}
                  <div className="flex justify-between items-center">
                    <span className={anoVigencia >= 2027 ? 'text-slate-500 line-through' : 'text-slate-300'}>
                      • PIS e COFINS (9,25%):
                    </span>
                    {anoVigencia >= 2027 ? (
                      <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                        EXTINTOS EM 01/01/2027
                      </span>
                    ) : (
                      <span className="text-amber-400">{fmt(calculos.valorPisCofins)}</span>
                    )}
                  </div>

                  {/* CBS Federal */}
                  <div className="flex justify-between items-center text-indigo-300">
                    <span>
                      • CBS Federal ({configFiscalAno.aliquotaCBS.toFixed(2)}% — {anoVigencia === 2027 ? 'PLENA' : 'Teste'}):
                    </span>
                    <span className="font-bold text-white">{fmt(calculos.valorCBS)}</span>
                  </div>

                  {/* IBS */}
                  <div className="flex justify-between items-center text-indigo-300">
                    <span>
                      • IBS Estadual ({configFiscalAno.aliquotaIBSEstadual.toFixed(2)}%) + Municipal ({configFiscalAno.aliquotaIBSMunicipal.toFixed(2)}%):
                    </span>
                    <span className="font-bold text-white">{fmt(calculos.valorIBS_Total)}</span>
                  </div>

                  {/* ICMS Transitório */}
                  {configFiscalAno.icmsAtivo && (
                    <div className="flex justify-between items-center text-amber-300 pt-1 border-t border-slate-800/80">
                      <span>
                        • ICMS Estadual Transitório ({configFiscalAno.aliquotaICMS}% deduzindo IBS):
                      </span>
                      <span className="font-bold">{fmt(calculos.valorICMS_Efetivo)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                    <span>• Imposto Seletivo (IS):</span>
                    <span className="text-emerald-400">R$ 0,00 (Não tributável em meias)</span>
                  </div>
                </div>
              </div>

              {/* CARD DE DESTAQUE: O IMPACTO DA VIRADA 2027 */}
              {anoVigencia === 2027 && (
                <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent p-4 rounded-2xl border border-indigo-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Balanço Federal da Virada em 2027 para a Fábrica & Distribuidor
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">PIS/COFINS Eliminado</span>
                      <span className="font-bold text-emerald-700">- {fmt(calculos.pisCofinsEliminado2027)}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Nova CBS (8,8%)</span>
                      <span className="font-bold text-indigo-700">+ {fmt(calculos.cbsNova2027)}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-emerald-800 block text-[10px]">Alívio Líquido Federal</span>
                      <span className="font-bold text-emerald-900">{fmt(calculos.saldoFederal2027)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    A fábrica substitui o PIS/COFINS por uma alíquota menor de CBS (8,8% vs 9,25%), e o distribuidor recupera 100% de crédito sem as restrições burocráticas antigas.
                  </p>
                </div>
              )}

              {/* Card Visão do Distribuidor */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Visão de Compra do Distribuidor ({anoVigencia})
                  </h3>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    perfilDistribuidor === 'regime_geral'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {perfilDistribuidor === 'regime_geral' ? 'Crédito Fiscal Integral' : 'Simples Nacional'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 my-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Preço Pago na Nota Fiscal</span>
                    <span className="text-base font-bold text-slate-800 font-mono">{fmt(calculos.valorTotalNFe)}</span>
                    <span className="text-[10px] text-slate-500 block">{fmt(calculos.precoBrutoPorParNFe)} / par</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 block text-[11px]">(-) Crédito Recuperado pelo Distribuidor</span>
                    <span className="text-base font-bold text-emerald-700 font-mono">
                      - {fmt(calculos.creditoApropriadoDistribuidor)}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      {perfilDistribuidor === 'regime_geral'
                        ? 'Abate 100% na saída das meias'
                        : 'Sem crédito no Simples'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-indigo-900 font-semibold block text-sm">
                      Custo Efetivo Real de Aquisição:
                    </span>
                    <span className="text-[11px] text-indigo-700">
                      O imposto faturado não vira custo para o distribuidor no Regime Geral!
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-900 font-mono">
                      {fmt(calculos.custoEfetivoAquisicaoDistribuidor)}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 block font-mono">
                      {fmt(calculos.custoEfetivoPorParDistribuidor)} / par
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 2: DIFERENÇAS TRIBUTÁRIAS EM 2027 ================= */}
        {activeTab === 'comparativo2027' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  O Que Muda na Prática em 2027 para a Fábrica de Meias?
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  O ano de 2027 é o grande marco da Reforma Tributária (LC 214/2025): o nível federal muda 100%, enquanto os estados e municípios iniciam a transição gradual.
                </p>
              </div>

              {/* Tabela Comparativa dos 3 Momentos */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Aspecto Tributário</th>
                      <th className="p-3.5 bg-slate-50">Até 2026 (Piloto / Antigo)</th>
                      <th className="p-3.5 bg-indigo-50/70 text-indigo-950 font-bold border-x border-indigo-200">
                        ⭐ 2027 (A Virada Federal)
                      </th>
                      <th className="p-3.5 bg-emerald-50 text-emerald-950 font-bold">2033 (Regime Pleno)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-mono">
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">PIS e COFINS</td>
                      <td className="p-3 bg-slate-50 text-amber-700">Vigentes (9,25% por dentro)</td>
                      <td className="p-3 bg-indigo-50/40 text-emerald-700 font-bold border-x border-indigo-200">
                        EXTINTOS EM 01/01/2027 (0%)
                      </td>
                      <td className="p-3 bg-emerald-50/40 text-emerald-700">Extintos</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">CBS (Federal)</td>
                      <td className="p-3 bg-slate-50">Alíquota teste (0,90%)</td>
                      <td className="p-3 bg-indigo-50/40 text-indigo-950 font-bold border-x border-indigo-200">
                        PLENA (8,80% por fora)
                      </td>
                      <td className="p-3 bg-emerald-50/40 font-bold text-emerald-900">Plena (8,80%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">IBS (Estados/Municípios)</td>
                      <td className="p-3 bg-slate-50">Alíquota teste (0,10%)</td>
                      <td className="p-3 bg-indigo-50/40 text-slate-800 border-x border-indigo-200">
                        Teste (0,10% compensável)
                      </td>
                      <td className="p-3 bg-emerald-50/40 font-bold text-emerald-900">Pleno (~17,7% por destino)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">ICMS Estadual</td>
                      <td className="p-3 bg-slate-50">100% Vigente (17% a 20%)</td>
                      <td className="p-3 bg-indigo-50/40 text-amber-800 border-x border-indigo-200">
                        100% Vigente (deduz IBS teste)
                      </td>
                      <td className="p-3 bg-emerald-50/40 text-emerald-700 font-bold">100% EXTINTO</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">Substituição Tributária (ST)</td>
                      <td className="p-3 bg-slate-50 text-red-600">ST com MVA de 40% a 60%</td>
                      <td className="p-3 bg-indigo-50/40 text-slate-800 border-x border-indigo-200">
                        ST só para ICMS; CBS sem ST!
                      </td>
                      <td className="p-3 bg-emerald-50/40 text-emerald-700 font-bold">ST 100% EXTINTA</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">Frete de Distribuição</td>
                      <td className="p-3 bg-slate-50">ICMS frete + PIS/COFINS</td>
                      <td className="p-3 bg-indigo-50/40 text-indigo-950 font-bold border-x border-indigo-200">
                        vFrete na base da CBS (8,8%)
                      </td>
                      <td className="p-3 bg-emerald-50/40 font-bold">vFrete na base RTC unificada</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900">API Serpro RTC</td>
                      <td className="p-3 bg-slate-50">aliquotasNominais opcional/proibido</td>
                      <td className="p-3 bg-indigo-50/40 text-indigo-900 font-bold border-x border-indigo-200">
                        aliquotasNominais OBRIGATÓRIO
                      </td>
                      <td className="p-3 bg-emerald-50/40 font-bold">aliquotasNominais obrigatório</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3 Cartões de Ação Prática para a Fábrica em 2027 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    1. Faturamento na NF-e
                  </div>
                  <p className="text-xs text-slate-600">
                    A partir de 01/01/2027, o ERP da fábrica precisa parar de enviar os grupos de PIS/COFINS e passar a gerar o grupo <code>&lt;IBSCBS&gt;</code> com a CBS a 8,8% e IBS a 0,1%.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    2. Argumento Comercial B2B
                  </div>
                  <p className="text-xs text-slate-600">
                    O distribuidor terá 100% de crédito da CBS na nota. Mostre a ele que a extinção do PIS/COFINS embutido reduz o custo efetivo de compra e destrava o fluxo financeiro.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    3. Convivência com o ICMS
                  </div>
                  <p className="text-xs text-slate-600">
                    Em 2027 o ICMS continua vivo. O sistema da fábrica precisa abater o IBS pago (0,10%) diretamente da guia de ICMS do estado de destino.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 3: API SERPRO RTC ================= */}
        {activeTab === 'api-rtc' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-600" />
                    Payload para a API Serpro RTC (Ano {anoVigencia})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {anoVigencia === 2027
                      ? 'Em 2027, o envio de "aliquotasNominais" é OBRIGATÓRIO pelo código Serpro RTC (ProcessamentoItemService.java).'
                      : 'Payload estruturado para simulação.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copiedJson ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedJson ? 'Copiado!' : 'Copiar JSON'}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-indigo-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[460px] leading-relaxed border border-slate-800">
                  {JSON.stringify(rtcApiPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LEGISLAÇÃO & REGRAS TÊXTIL ================= */}
        {activeTab === 'legislacao' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Guia Fiscal da Reforma Tributária para Fábrica de Meias e Confecção
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    1. Enquadramento e Alíquotas de Meias
                  </h3>
                  <p>
                    Artigos de vestuário, meias e malharia classificados no Capítulo 61 da NCM (como 6115) <strong>não possuem redução de alíquota</strong> nem fazem parte da cesta básica de alimentos.
                  </p>
                  <p>
                    Eles estão sujeitos à <strong>Alíquota Padrão</strong> do Regime Geral.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    2. Tratamento do Frete de Distribuição
                  </h3>
                  <p>
                    O frete cobrado na mesma nota fiscal de venda (frete CIF destacado no campo <code className="bg-slate-200 px-1 rounded">vFrete</code>) <strong>sempre soma na base de cálculo</strong> da CBS e do IBS.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    3. Imposto Seletivo (IS) — &quot;Imposto do Pecado&quot;
                  </h3>
                  <p>
                    O Imposto Seletivo <strong>não incide sobre meias ou artigos têxteis</strong>. Ele é restrito a veículos, bebidas alcoólicas, cigarros, refrigerantes e minerais poluentes.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    4. Cronograma de Transição
                  </h3>
                  <p>
                    <strong>2026</strong>: Ano de testes (alíquota teste de 0,9% CBS e 0,1% IBS).
                  </p>
                  <p>
                    <strong>2027</strong>: Extinção definitiva do PIS e COFINS e entrada plena da CBS (8,8%).
                  </p>
                  <p>
                    <strong>2029 a 2032</strong>: Extinção gradativa do ICMS e ISS (à razão de 1/10 ao ano) e elevação correspondente do IBS.
                  </p>
                  <p>
                    <strong>2033</strong>: Novo sistema tributário em pleno vigor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
