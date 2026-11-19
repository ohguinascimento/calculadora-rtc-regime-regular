$ErrorActionPreference = "Stop"

$audioDir = "audio_tiktok_parts"
if (Test-Path $audioDir) {
    Remove-Item $audioDir -Recurse -Force
}
New-Item -ItemType Directory -Path $audioDir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Maria Desktop")
$synth.Rate = 2  # Ritmo enérgico estilo TikTok/Reels

$clips = @(
    @{ id = "part_01"; start = 0.5;  text = "Você tem fábrica ou distribuidora? Veja agora o que muda em primeiro de janeiro de 2027 na Reforma Tributária!" },
    @{ id = "part_02"; start = 10.0; text = "Primeira grande mudança: PIS e COFINS são 100% extintos! A alíquota de 9,25% por dentro desaparece e campos de PIS passam a ser rejeitados na nota fiscal." },
    @{ id = "part_03"; start = 24.0; text = "No lugar, entra a CBS federal plena de 8,8% por fora, incidindo sobre as meias e o frete de distribuição, com alíquota menor e transparente." },
    @{ id = "part_04"; start = 36.0; text = "Mas atenção: em 2027 o ICMS continua valendo normalmente. O novo IBS entra em fase de teste a 0,1%, sendo compensado na guia do ICMS estadual." },
    @{ id = "part_05"; start = 50.5; text = "E o melhor para o seu distribuidor: na CBS ele tem crédito fiscal de 100% imediato. Com o RTC Preço Fácil, sua indústria já está pronta para 2027!" }
)

Write-Host "Gerando narração sincronizada para o TikTok..."
for ($i = 0; $i -lt $clips.Count; $i++) {
    $c = $clips[$i]
    $outFile = Join-Path $audioDir "$($c.id).wav"
    $synth.SetOutputToWaveFile($outFile)
    $synth.Speak($c.text)
    $dur = (ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $outFile)
    Write-Host "  -> Clip $($c.id): duracao $dur s (inicia em $($c.start)s)"
}
$synth.Dispose()

# Mixagem com ffmpeg
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

# Duração total: 64.5s
$totalDur = 64.5
$fullFilter = "${filterParts}${mixInputs}amix=inputs=$($clips.Count):dropout_transition=0:normalize=0,volume=1.9"
$outputWav = "audio_tiktok_completo.wav"

Write-Host "Mixando áudio TikTok para $totalDur segundos..."
& ffmpeg -y ($inputs.Trim().Split(" ")) -filter_complex "$fullFilter" -t $totalDur "$outputWav"

Write-Host "Áudio TikTok gerado com sucesso em $outputWav!"
