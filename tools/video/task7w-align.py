"""Align readable captions to recognition timestamps from the generated speech."""
import difflib
import json
import re
import subprocess
import textwrap
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "demo-video/output/task7w"
local_model = Path("/tmp/chog-whisper-base.en")
model = WhisperModel(str(local_model) if local_model.is_dir() else "base.en", device="cpu", compute_type="int8", cpu_threads=2,
                     num_workers=1, download_root="/tmp/chog-video-whisper")
timeline = json.loads((OUT / "timeline.json").read_text())
captions, report = [], []

def normalize(word):
    return re.sub(r"[^a-z0-9]", "", word.lower()).replace("chawg", "chog").replace("chug", "chog")

for part in timeline:
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(OUT / f"voice-{part['index']}.wav"),
                                   "-f", "f32le", "-ar", "16000", "-ac", "1", "pipe:1"])
    segments, _ = model.transcribe(np.frombuffer(raw, dtype=np.float32), language="en",
                                   beam_size=5, word_timestamps=True, vad_filter=False)
    words = [word for segment in segments for word in (segment.words or [])]
    expected = part["text"].split()
    # Merge spelled initialisms for alignment, preserving recognizer output below.
    merged = []
    for word in words:
        merged.append({"text": word.word.strip(), "start": word.start, "end": word.end})
    for letters in (("n", "f", "t"), ("x", "p")):
        i = 0
        while i <= len(merged)-len(letters):
            if tuple(normalize(w["text"]) for w in merged[i:i+len(letters)]) == letters:
                block = merged[i:i+len(letters)]
                merged[i:i+len(letters)] = [{"text": "".join(letters), "start": block[0]["start"], "end": block[-1]["end"]}]
            i += 1
    matcher = difflib.SequenceMatcher(None, [normalize(w) for w in expected],
                                      [normalize(w["text"]) for w in merged], autojunk=False)
    matches = {}
    for block in matcher.get_matching_blocks():
        for j in range(block.size):
            matches[block.a+j] = block.b+j
    report.append({"paragraph": part["index"], "expected": part["text"],
                   "recognized": " ".join(w.word.strip() for w in words),
                   "word_match_ratio": matcher.ratio(), "recognized_words": merged})
    print(json.dumps(report[-1] | {"recognized_words": "saved in report"}), flush=True)
    # Hold the short closing slogan as one readable caption. The final domain is
    # spoken as words; both use their actual recognized paragraph boundaries.
    if part["index"] >= len(timeline)-2:
        captions.append({"text": part["text"], "start": part["start"]+words[0].start,
                         "end": part["start"]+words[-1].end+.12})
        continue
    assert matcher.ratio() > .68, "Speech needs review before making captions"
    start, pending = 0, []
    for i, word in enumerate(expected):
        pending.append(word)
        if len(" ".join(pending)) >= 56 or word.endswith((".", "?", "!")) or i == len(expected)-1:
            anchors = [j for j in range(start, i+1) if j in matches]
            assert anchors, "Caption has no actual speech timestamp"
            begin = merged[matches[anchors[0]]]["start"]
            end = merged[matches[anchors[-1]]]["end"]
            # Include unmatched edge words using neighboring recognized boundaries.
            if anchors[0] > start:
                begin = merged[max(0, matches[anchors[0]]-(anchors[0]-start))]["start"]
            if anchors[-1] < i:
                end = merged[min(len(merged)-1, matches[anchors[-1]]+(i-anchors[-1]))]["end"]
            captions.append({"text": " ".join(pending), "start": part["start"]+begin,
                             "end": min(part["start"]+end+.12, part["start"]+part["duration"])})
            start, pending = i+1, []
for i, caption in enumerate(captions):
    if i+1 < len(captions):
        caption["end"] = min(caption["end"], captions[i+1]["start"]-.02)
    assert 0 <= caption["start"] < caption["end"] <= 60
(OUT / "captions.json").write_text(json.dumps(captions, indent=2)+"\n")
(OUT / "speech-alignment.json").write_text(json.dumps(report, indent=2)+"\n")

def stamp(t, ass=False):
    n = round(t*(100 if ass else 1000))
    if ass:
        return f"{n//360000}:{n//6000%60:02}:{n//100%60:02}.{n%100:02}"
    return f"{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}"

def lines(text):
    if len(text) <= 40:
        return [text]
    words = text.split()
    split = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i]))-len(" ".join(words[i:]))))
    return [" ".join(words[:split]), " ".join(words[split:])]

(OUT / "subtitles.srt").write_text("\n\n".join(
    f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+"\n".join(lines(c['text']))
    for i, c in enumerate(captions))+"\n")
header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,43,&H00FFFFFF,&H00FFFFFF,&H00101818,&H70101818,-1,0,0,0,100,100,0,0,3,14,0,2,120,120,100,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
events = []
for c in captions:
    text = r"\N".join(lines(c["text"]))
    events.append(f"Dialogue: 0,{stamp(c['start'], True)},{stamp(c['end'], True)},Default,,0,0,0,,{text}")
(OUT / "subtitles.ass").write_text(header+"\n".join(events)+"\n")
