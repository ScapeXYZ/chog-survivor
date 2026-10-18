"""Generate Task 7W stock narration; never reads wallet or browser data.

Run in the isolated environment documented in TASK_7W_NARRATED_VIDEO.md.
Inputs/outputs stay in the ignored demo-video workspace until reviewed.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "demo-video/output/task7w"
MODELS = {
    "/tmp/chog-kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
    "/tmp/chog-voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}
for filename, expected in MODELS.items():
    assert hashlib.sha256(Path(filename).read_bytes()).hexdigest() == expected, filename
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
session = ort.InferenceSession(next(iter(MODELS)), sess_options=options, providers=["CPUExecutionProvider"])
voice = Kokoro.from_session(session, "/tmp/chog-voices-v1.0.bin")
OUT.mkdir(parents=True, exist_ok=True)
paragraphs = (ROOT / "tools/video/task7w-script.txt").read_text().strip().split("\n\n")
parts = []
for index, text in enumerate(paragraphs):
    spoken = text.replace("CHOG", "Chawg").replace("Chog", "Chawg")
    spoken = spoken.replace("NFT", "N F T").replace("XP", "X P")
    spoken = spoken.replace("chog-survivor.vercel.app", "chawg survivor dot vercel dot app")
    samples, rate = voice.create(spoken, voice="af_heart", speed=1.02, lang="en-us")
    assert rate == 24000
    sf.write(OUT / f"voice-{index}.wav", samples, rate, subtype="PCM_16")
    parts.append({"text": text, "spoken": spoken, "samples": samples, "duration": len(samples) / rate})
    print(index, round(parts[-1]["duration"], 3), text, flush=True)
# Preserve natural speech, distributing silence between paragraphs rather than
# stretching the voice. The existing Remotion picture remains exactly 60 seconds.
speech = sum(p["duration"] for p in parts)
assert speech < 57.5, f"Speech exceeds the natural 60-second edit: {speech}"
gap = min(1.1, (58.5 - speech) / (len(parts) - 1))
cursor = 0.65
full = np.zeros(60 * rate, dtype=np.float32)
timeline = []
for i, part in enumerate(parts):
    start = round(cursor * rate)
    full[start:start + len(part["samples"])] = part["samples"]
    timeline.append({k: v for k, v in part.items() if k != "samples"} | {"index": i, "start": start / rate})
    cursor += part["duration"] + gap
sf.write(OUT / "narration-raw.wav", full, rate, subtype="PCM_16")
(OUT / "timeline.json").write_text(json.dumps(timeline, indent=2) + "\n")
print("Speech seconds:", speech, "paragraph gap:", gap, "last voice end:", cursor-gap, flush=True)
