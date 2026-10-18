"""Finish the existing Remotion picture with measured narration/music and ASS captions.

The source video is deliberately not regenerated: this preserves every approved
picture frame, original transitions, guest labels and mainnet-proof disclaimer.
"""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "demo-video/output/task7w"
SOURCE = ROOT / "frontend/public/chog-survivor-walkthrough-60s.mp4"
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == "816c4fd4affb9470d107da1d073bc3fdd17b2adea4b600ecf00e7a9322b6c9ff"

def normalize(source, destination, target, peak):
    setting = f"loudnorm=I={target}:TP={peak}:LRA=7"
    result = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(source), "-t", "60", "-af",
                             setting+":print_format=json", "-f", "null", "-"], capture_output=True, text=True, check=True)
    measured = json.loads(result.stderr[result.stderr.rindex("{"):])
    (OUT / (destination.stem+"-normalization.json")).write_text(json.dumps(measured, indent=2)+"\n")
    linear = (f":measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
              f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
              f":offset={measured['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-t", "60", "-af",
                    setting+linear, "-ar", "48000", str(destination)], check=True)

normalize(OUT / "narration-raw.wav", OUT / "narration.wav", -16, -2)
normalize(ROOT / "demo-video/public/media/ambience.wav", OUT / "music.wav", -34, -6)
# Original procedural music is 18 LU below narration before further ducking.
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(OUT / "narration.wav"), "-i", str(OUT / "music.wav"),
    "-filter_complex", "[0:a]asplit=2[voice][key];[1:a][key]sidechaincompress=threshold=0.02:ratio=4:attack=20:release=350[bed];[voice][bed]amix=inputs=2:normalize=0,alimiter=limit=0.87:level=false,afade=t=in:d=0.15,afade=t=out:st=59:d=1[mix]",
    "-map", "[mix]", "-t", "60", "-ar", "48000", "-ac", "2", str(OUT / "mix.wav")], check=True)
destination = ROOT / "frontend/public/chog-survivor-narrated-60s.mp4"
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-i", str(SOURCE), "-i", str(OUT / "mix.wav"),
    "-map", "0:v:0", "-map", "1:a:0", "-vf", f"ass={OUT / 'subtitles.ass'}",
    "-t", "60", "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
    "-metadata", "title=CHOG SURVIVOR — Narrated product walkthrough",
    "-metadata", "comment=Licensed synthetic English narration. Guest Mode is off-chain. No completed mainnet action is depicted.",
    str(destination)], check=True)
(ROOT / "frontend/public/chog-survivor-narrated-60s.srt").write_bytes((OUT / "subtitles.srt").read_bytes())
print("Finished distinct narrated export:", destination, flush=True)
