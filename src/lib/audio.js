// 音声ファイル・録音データを「16kHz モノラル WAV」に変換し、一定秒数ごとに分割する
// （文字起こしAPIに送るサイズを小さく・形式を一定にするため）

export const TARGET_RATE = 16000;
export const CHUNK_SECONDS = 300; // 5分ごと

// Blob → AudioBuffer（16kHz・モノラル）
export async function decodeTo16k(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  // OfflineAudioContext の sampleRate を 16k にすると、デコード時にその周波数へ変換される
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new Ctx(1, 1, TARGET_RATE);
  const decoded = await new Promise((resolve, reject) => {
    // Safari 対策：コールバック形式で呼ぶ
    const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
  return toMono(decoded);
}

// 複数チャンネルを平均してモノラルの Float32Array にする
function toMono(audioBuffer) {
  const { numberOfChannels, length, sampleRate } = audioBuffer;
  const out = new Float32Array(length);
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) out[i] += data[i] / numberOfChannels;
  }
  return { samples: out, sampleRate };
}

// Float32Array → WAV(16bit PCM) Blob
export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

// 音声Blob → { blob(WAV), offset(秒) } の配列（5分ごとに分割）
export async function blobToWavChunks(blob, chunkSeconds = CHUNK_SECONDS) {
  const { samples, sampleRate } = await decodeTo16k(blob);
  const chunkLen = chunkSeconds * sampleRate;
  const chunks = [];
  for (let start = 0; start < samples.length; start += chunkLen) {
    const part = samples.subarray(start, Math.min(start + chunkLen, samples.length));
    if (part.length < sampleRate * 0.5) continue; // 0.5秒未満の端切れは無視
    chunks.push({ blob: encodeWav(part, sampleRate), offset: start / sampleRate, seconds: part.length / sampleRate });
  }
  return chunks;
}

// 録音に使える MIME タイプを選ぶ（iPhone は mp4、Android/PC は webm）
export function pickRecorderMime() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
}
