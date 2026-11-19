$ErrorActionPreference = "Stop"

$audioDir = "audio_parts"
if (Test-Path $audioDir) {
    Remove-Item $audioDir -Recurse -Force
}
New-Item -ItemType Directory -Path $audioDir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Maria Desktop")
$synth.Rate = 3  # Ritmo ágil e dinâmico

$clips = @(
    @{ id = "part_01"; start = 0.5;  text = "Bem-vindo ao simulador de precificação para fábrica de meias na Reforma Tributária da LC 214." },
    @{ id = "part_02"; start = 8.0;  text = "Selecionamos a Meia Esportiva e o lote de 4.800 pares. O sistema calcula a desoneração de insumos com créditos de IBS e CBS." },
    @{ id = "part_03"; start = 17.0; text = "Ajustamos a margem para 32%. O frete é destacado no campo vFrete e somado à base de cálculo unificada." },
    @{ id = "part_04"; start = 25.5; text = "Pelo princípio do destino, ao escolher o Paraná, o sistema calcula na hora o IBS estadual e municipal por fora." },
    @{ id = "part_05"; start = 34.0; text = "No Regime Geral, o distribuidor tem 100% de crédito fiscal, e o Split Payment separa os tributos no pagamento." },
    @{ id = "part_06"; start = 44.0; text = "No comparativo, comprovamos o fim do ICMS-ST e da MVA, destravando o capital de giro do distribuidor." },
    @{ id = "part_07"; start = 53.0; text = "Na aba de API, geramos o payload JSON oficial pronto para envio à Calculadora Serpro RTC." },
    @{ id = "part_08"; start = 62.0; text = "E o guia traz todas as regras da legislação têxtil. RTC Preço Fácil: inteligência na nova tributação." }
)

Write-Host "Gerando áudios com Microsoft Maria Desktop..."
foreach ($c in $clips) {
    $outFile = Join-Path $audioDir "$($c.id).wav"
    $synth.SetOutputToWaveFile($outFile)
    $synth.Speak($c.text)
    $dur = (ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $outFile)
    Write-Host "  -> $($c.id).wav : $dur s (inicia em $($c.start)s)"
}
$synth.Dispose()

Write-Host "Montando comando ffmpeg para mixagem dos áudios..."

$inputs = ""
$filterParts = ""
$mixInputs = ""

for ($i = 0; $i -lt $clips.Count; $i++) {
    $c = $clips[$i]
    $wavPath = Join-Path $audioDir "$($c.id).wav"
    $delayMs = [int]($c.start * 1000)
    $inputs += " -i `"$wavPath`""
    $filterParts += "[$($i):a]adelay=$delayMs|$delayMs[a$i]; "
    $mixInputs += "[a$i]"
}

$fullFilter = "${filterParts}${mixInputs}amix=inputs=$($clips.Count):dropout_transition=0:normalize=0,volume=1.8"

$outputWav = "audio_completo.wav"
Write-Host "Executando ffmpeg para gerar áudio master de 70.45s..."
& ffmpeg -y ($inputs.Trim().Split(" ")) -filter_complex "$fullFilter" -t 70.45 "$outputWav"

if (-not (Test-Path $outputWav)) {
    throw "Falha ao gerar audio_completo.wav"
}

Write-Host "Unindo vídeo com áudio em demo-video-com-audio.mp4..."
$finalMp4 = "demo-video-com-audio.mp4"
& ffmpeg -y -i demo-video.mp4 -i "$outputWav" -c:v copy -c:a aac -b:a 192k -shortest "$finalMp4"

if (-not (Test-Path $finalMp4)) {
    throw "Falha ao gerar $finalMp4"
}

# Atualizar os arquivos finais
Copy-Item $finalMp4 "demo-video.mp4" -Force
$artifactDest = "C:\Users\Guilherme\.gemini\antigravity\brain\bb499f71-64f2-4ae2-8d50-d9c0ff81b0ef\demo-video.mp4"
Copy-Item $finalMp4 $artifactDest -Force

Write-Host ">>> SUCESSO! Vídeo com áudio explicativo sincronizado gerado com êxito!"
Get-Item "demo-video.mp4" | Select-Object FullName, Length
