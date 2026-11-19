import os
import sys
import json
import argparse
import subprocess
import urllib.request
import urllib.error

# Configuração de Modelos e Voz Padrão do ElevenLabs
DEFAULT_MODEL = "eleven_multilingual_v2"
# Voz padrão (Adam - tom profissional, dinâmico e claro)
DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"

TIKTOK_CLIPS = [
    {
        "id": "part_01",
        "start": 0.5,
        "text": "Você tem fábrica ou distribuidora? Veja agora o que muda em primeiro de janeiro de 2027 na Reforma Tributária!"
    },
    {
        "id": "part_02",
        "start": 10.0,
        "text": "Primeira grande mudança: PIS e COFINS são 100% extintos! A alíquota de 9,25% por dentro desaparece e campos de PIS passam a ser rejeitados na nota fiscal."
    },
    {
        "id": "part_03",
        "start": 24.0,
        "text": "No lugar, entra a CBS federal plena de 8,8% por fora, incidindo sobre as meias e o frete de distribuição, com alíquota menor e transparente."
    },
    {
        "id": "part_04",
        "start": 36.0,
        "text": "Mas atenção: em 2027 o ICMS continua valendo normalmente. O novo IBS entra em fase de teste a 0,1%, sendo compensado na guia do ICMS estadual."
    },
    {
        "id": "part_05",
        "start": 50.5,
        "text": "E o melhor para o seu distribuidor: na CBS ele tem crédito fiscal de 100% imediato. Com o RTC Preço Fácil, sua indústria já está pronta para 2027!"
    }
]

DESKTOP_CLIPS = [
    {
        "id": "part_01",
        "start": 0.5,
        "text": "Bem-vindo ao simulador de precificação para fábrica de meias na Reforma Tributária da LC 214."
    },
    {
        "id": "part_02",
        "start": 8.0,
        "text": "Selecionamos a Meia Esportiva e o lote de 4.800 pares. O sistema calcula a desoneração de insumos com créditos de IBS e CBS."
    },
    {
        "id": "part_03",
        "start": 17.0,
        "text": "Ajustamos a margem para 32%. O frete é destacado no campo vFrete e somado à base de cálculo unificada."
    },
    {
        "id": "part_04",
        "start": 25.5,
        "text": "Pelo princípio do destino, ao escolher o Paraná, o sistema calcula na hora o IBS estadual e municipal por fora."
    },
    {
        "id": "part_05",
        "start": 34.0,
        "text": "No Regime Geral, o distribuidor tem 100% de crédito fiscal, e o Split Payment separa os tributos no pagamento."
    },
    {
        "id": "part_06",
        "start": 44.0,
        "text": "No comparativo, comprovamos o fim do ICMS-ST e da MVA, destravando o capital de giro do distribuidor."
    },
    {
        "id": "part_07",
        "start": 53.0,
        "text": "Na aba de API, geramos o payload JSON oficial pronto para envio à Calculadora Serpro RTC."
    },
    {
        "id": "part_08",
        "start": 62.0,
        "text": "E o guia traz todas as regras da legislação têxtil. RTC Preço Fácil: inteligência na nova tributação."
    }
]

def validate_key(api_key: str):
    url = "https://api.elevenlabs.io/v1/user"
    req = urllib.request.Request(url, headers={"xi-api-key": api_key.strip()})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            sub = data.get("subscription", {})
            tier = sub.get("tier", "free")
            chars = sub.get("character_count", 0)
            limit = sub.get("character_limit", 0)
            print(f"[OK] Chave ElevenLabs autenticada com sucesso!")
            print(f"     Plano: {tier.upper()} | Caracteres usados: {chars}/{limit}")
            return True, data
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"[ERRO] Falha de autenticação na ElevenLabs (HTTP {e.code}):\n{err_msg}")
        return False, err_msg
    except Exception as e:
        print(f"[ERRO] Conexão: {e}")
        return False, str(e)

def list_voices(api_key: str):
    url = "https://api.elevenlabs.io/v1/voices"
    req = urllib.request.Request(url, headers={"xi-api-key": api_key.strip()})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("voices", [])
    except Exception as e:
        print(f"[AVISO] Não foi possível listar vozes: {e}")
        return []

def synthesize_clip(api_key: str, text: str, voice_id: str, output_path: str):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": DEFAULT_MODEL,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "xi-api-key": api_key.strip(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
    )
    with urllib.request.urlopen(req) as resp:
        with open(output_path, "wb") as f:
            f.write(resp.read())

def mix_and_merge(clips, audio_folder, output_wav, total_duration, input_video, output_video):
    inputs = []
    filter_parts = []
    mix_inputs = []

    for i, c in enumerate(clips):
        mp3_file = os.path.join(audio_folder, f"{c['id']}.mp3")
        delay_ms = int(c["start"] * 1000)
        inputs.extend(["-i", mp3_file])
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}];")
        mix_inputs.append(f"[a{i}]")

    full_filter = "".join(filter_parts) + "".join(mix_inputs) + f"amix=inputs={len(clips)}:dropout_transition=0:normalize=0,volume=1.8"

    # Gerar o áudio completo sincronizado
    cmd_audio = ["ffmpeg", "-y"] + inputs + ["-filter_complex", full_filter, "-t", str(total_duration), output_wav]
    print(f"Executando mixagem de áudio com ffmpeg: {output_wav}")
    subprocess.run(cmd_audio, check=True)

    # Juntar áudio com vídeo
    if os.path.exists(input_video):
        print(f"Unindo áudio ao vídeo {input_video} -> {output_video}")
        cmd_merge = [
            "ffmpeg", "-y",
            "-i", input_video,
            "-i", output_wav,
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output_video
        ]
        subprocess.run(cmd_merge, check=True)
        print(f"[CONCLUÍDO] Vídeo final gerado: {output_video}")
    else:
        print(f"[AVISO] Arquivo de vídeo base não encontrado: {input_video}")

def main():
    parser = argparse.ArgumentParser(description="Geração de Voz Studio com ElevenLabs para Vídeos RTC")
    parser.add_argument("--api-key", default=os.getenv("ELEVENLABS_API_KEY"), help="Sua chave secreta da ElevenLabs (começa com sk_...)")
    parser.add_argument("--voice-id", default=DEFAULT_VOICE_ID, help="Voice ID do ElevenLabs")
    parser.add_argument("--target", choices=["tiktok", "desktop", "all"], default="all", help="Qual vídeo gerar narração")
    args = parser.parse_args()

    if not args.api_key:
        print("[ERRO] Forneça a chave secreta da ElevenLabs usando --api-key sk_... ou defina a variável ELEVENLABS_API_KEY")
        sys.exit(1)

    ok, info = validate_key(args.api_key)
    if not ok:
        sys.exit(1)

    # Criar diretórios de áudio
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    media_dir = os.path.join(base_dir, "media")
    audio_temp_dir = os.path.join(media_dir, "elevenlabs_temp")
    os.makedirs(audio_temp_dir, exist_ok=True)

    voice_id = args.voice_id
    print(f"Usando Voice ID: {voice_id}")

    # Processar TikTok (64.5s)
    if args.target in ["tiktok", "all"]:
        print("\n=== GERANDO NARRAÇÃO TIKTOK (9:16) COM ELEVENLABS ===")
        tiktok_audio_dir = os.path.join(audio_temp_dir, "tiktok")
        os.makedirs(tiktok_audio_dir, exist_ok=True)

        for c in TIKTOK_CLIPS:
            out_mp3 = os.path.join(tiktok_audio_dir, f"{c['id']}.mp3")
            print(f" -> Sintetizando clip {c['id']} ({c['start']}s)...")
            synthesize_clip(args.api_key, c["text"], voice_id, out_mp3)

        tiktok_wav = os.path.join(media_dir, "elevenlabs_tiktok.wav")
        tiktok_in_video = os.path.join(media_dir, "demo-tiktok-2027.mp4")
        tiktok_out_video = os.path.join(media_dir, "demo-tiktok-2027-elevenlabs.mp4")

        mix_and_merge(TIKTOK_CLIPS, tiktok_audio_dir, tiktok_wav, 64.5, tiktok_in_video, tiktok_out_video)

    # Processar Desktop (70.5s)
    if args.target in ["desktop", "all"]:
        print("\n=== GERANDO NARRAÇÃO DESKTOP (16:9) COM ELEVENLABS ===")
        desktop_audio_dir = os.path.join(audio_temp_dir, "desktop")
        os.makedirs(desktop_audio_dir, exist_ok=True)

        for c in DESKTOP_CLIPS:
            out_mp3 = os.path.join(desktop_audio_dir, f"{c['id']}.mp3")
            print(f" -> Sintetizando clip {c['id']} ({c['start']}s)...")
            synthesize_clip(args.api_key, c["text"], voice_id, out_mp3)

        desktop_wav = os.path.join(media_dir, "elevenlabs_desktop.wav")
        desktop_in_video = os.path.join(media_dir, "demo-video.mp4")
        desktop_out_video = os.path.join(media_dir, "demo-video-elevenlabs.mp4")

        mix_and_merge(DESKTOP_CLIPS, desktop_audio_dir, desktop_wav, 70.45, desktop_in_video, desktop_out_video)

    # Atualizar cópias principais e artefatos
    artifact_dir = r"C:\Users\Guilherme\.gemini\antigravity\brain\bb499f71-64f2-4ae2-8d50-d9c0ff81b0ef"
    import shutil

    if args.target in ["tiktok", "all"] and os.path.exists(tiktok_out_video):
        shutil.copy2(tiktok_out_video, tiktok_in_video)
        if os.path.exists(artifact_dir):
            shutil.copy2(tiktok_out_video, os.path.join(artifact_dir, "demo-tiktok-2027.mp4"))
        print("[OK] Vídeo TikTok atualizado com narração ElevenLabs!")

    if args.target in ["desktop", "all"] and os.path.exists(desktop_out_video):
        shutil.copy2(desktop_out_video, desktop_in_video)
        if os.path.exists(artifact_dir):
            shutil.copy2(desktop_out_video, os.path.join(artifact_dir, "demo-video.mp4"))
        print("[OK] Vídeo Desktop atualizado com narração ElevenLabs!")

    print("\n[SUCESSO] Processo de geração com ElevenLabs finalizado!")

if __name__ == "__main__":
    main()
