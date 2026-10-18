"""Objective export checks; does not claim subjective human listening approval."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/evidence/task7w"
WORK = ROOT / "demo-video/output/task7w"
VIDEO = ROOT / "frontend/public/chog-survivor-narrated-60s.mp4"
OUT.mkdir(parents=True, exist_ok=True)

def loudness(path):
    result = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af",
        "loudnorm=I=-16:TP=-1:LRA=7:print_format=json", "-f", "null", "-"],
        check=True, capture_output=True, text=True)
    return json.loads(result.stderr[result.stderr.rindex("{"):])

probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(VIDEO)]))
assert 55 <= float(probe["format"]["duration"]) <= 65
video = next(s for s in probe["streams"] if s["codec_type"] == "video")
audio = next(s for s in probe["streams"] if s["codec_type"] == "audio")
assert (video["codec_name"], video["pix_fmt"], video["width"], video["height"]) == ("h264", "yuv420p", 1920, 1080)
assert video["avg_frame_rate"] == "30/1" and audio["codec_name"] == "aac" and audio["channels"] == 2
subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(VIDEO), "-f", "null", "-"], check=True)
levels = {name: loudness(path) for name, path in {
    "narration": WORK / "narration.wav", "music_before_ducking": WORK / "music.wav", "final_export": VIDEO}.items()}
assert -18 <= float(levels["final_export"]["input_i"]) <= -14
assert float(levels["final_export"]["input_tp"]) <= -1
assert float(levels["narration"]["input_i"]) - float(levels["music_before_ducking"]["input_i"]) >= 16
captions = json.loads((WORK / "captions.json").read_text())
expected = (ROOT / "tools/video/task7w-script.txt").read_text()
assert " ".join(" ".join(c["text"].split()) for c in captions) == " ".join(expected.split())
for i, c in enumerate(captions):
    assert 0 <= c["start"] < c["end"] <= 60
    if i:
        assert captions[i-1]["end"] <= c["start"]
    assert len(c["text"].split())/(c["end"]-c["start"])*60 < 350, c
local_model = Path("/tmp/chog-whisper-base.en")
model = WhisperModel(str(local_model) if local_model.is_dir() else "base.en", device="cpu", compute_type="int8", cpu_threads=2,
                     num_workers=1, download_root="/tmp/chog-video-whisper")
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(VIDEO), "-f", "f32le", "-ar", "16000", "-ac", "1", "pipe:1"])
segments, _ = model.transcribe(np.frombuffer(raw, dtype=np.float32), language="en", beam_size=5, word_timestamps=True, vad_filter=False)
recognized = [{"start": s.start, "end": s.end, "text": s.text} for s in segments]
text = " ".join(s["text"] for s in recognized).lower()
for phrase in ("guest mode", "survival encounters", "transaction confirmation", "your choices"):
    assert phrase in text, (phrase, text)
data = VIDEO.read_bytes()
assert 0 < data.find(b"moov") < data.find(b"mdat")
report = {"passed": True, "probe": probe, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
          "levels": levels, "caption_count": len(captions), "final_audio_recognition": recognized,
          "human_listening_review_claimed": False, "prior_source_video_unchanged": hashlib.sha256(
              (ROOT / "frontend/public/chog-survivor-walkthrough-60s.mp4").read_bytes()).hexdigest() ==
              "816c4fd4affb9470d107da1d073bc3fdd17b2adea4b600ecf00e7a9322b6c9ff"}
assert report["prior_source_video_unchanged"]
(OUT / "export-review.json").write_text(json.dumps(report, indent=2)+"\n")
print(json.dumps({k: report[k] for k in ("passed", "sha256", "bytes", "caption_count", "levels", "final_audio_recognition")}, indent=2))
