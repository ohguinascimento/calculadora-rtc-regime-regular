import asyncio
import os
import subprocess
import edge_tts

VOICE = "pt-BR-AntonioNeural"

SCRIPTS = [
    {
        "id": "part_01",
        "start_sec": 0.5,
        "text": "Bem-vindo ao RTC Preço Fácil, o simulador de precificação para fábrica de meias na Reforma Tributária da Lei Complementar 214 de 2025."
    },
    {
        "id": "part_02",
        "start_sec": 7.0,
        "text": "Na primeira etapa, escolhemos a Meia Esportiva Atoalhada e definimos o lote para 4.800 pares. O sistema calcula a desoneração dos insumos com créditos de entrada de IBS e CBS."
    },
    {
        "id": "part_03",
        "start_sec": 16.0,
        "text": "Ajustamos a margem da fábrica para 32%. O frete de distribuição é destacado no campo vFrete e somado à base de cálculo unificada do produto."
    },
    {
        "id": "part_04",
        "start_sec": 24.5,
        "text": "Pelo princípio do destino, ao selecionar o estado do Paraná, o motor atualiza na hora o IBS estadual e municipal, aplicando o cálculo por fora."
    },
    {
        "id": "part_05",
        "start_sec": 33.5,
        "text": "Na visão B2B, o distribuidor no Regime Geral recupera 100% de crédito fiscal, anulando o custo do imposto. E o Split Payment divide os valores automaticamente no pagamento."
    },
    {
        "id": "part_06",
        "start_sec": 44.5,
        "text": "No comparativo, vemos o grande benefício: o fim definitivo do ICMS-ST e da MVA, liberando o capital de giro do distribuidor."
    },
    {
        "id": "part_07",
        "start_sec": 54.0,
        "text": "Na aba da API, o sistema gera o payload JSON oficial formatado para envio direto à Calculadora Serpro RTC deste projeto."
    },
    {
        "id": "part_08",
        "start_sec": 63.0,
        "text": "E no guia prático, você confere todas as regras da legislação têxtil. RTC Preço Fácil: inteligência e conformidade fiscal."
    }
]

async def generate_speech():
    os.makedirs("audio_parts", exist_ok=True)
    for item in SCRIPTS:
        filename = f"audio_parts/{item['id']}.mp3"
        print(f"Generating {filename}...")
        communicate = edge_tts.Communicate(item["text"], VOICE)
        await communicate.save(filename)
    print("All speech clips generated successfully.")

if __name__ == "__main__":
    asyncio.run(generate_speech())
