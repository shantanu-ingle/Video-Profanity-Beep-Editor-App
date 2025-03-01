import os
import torch
import numpy as np
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from better_profanity import profanity
from pydub import AudioSegment
from pydub.generators import Sine
import whisper
import subprocess
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'temp/uploads'
OUTPUT_FOLDER = 'temp/outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

profanity.load_censor_words()
model = whisper.load_model("tiny", device=device)
BEEP = Sine(1000).to_audio_segment(duration=100)

def process_video(input_path, output_path):
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], "temp_audio.wav")
    
    # Step 1: Extract audio
    print("Extracting audio...")
    ffmpeg_cmd = [
        "ffmpeg", "-i", input_path, "-acodec", "pcm_s16le", "-ac", "1", "-ar", "44100", "-vn", "-y", audio_path
    ]
    try:
        subprocess.run(ffmpeg_cmd, check=True, stderr=subprocess.PIPE, universal_newlines=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error extracting audio: {e.stderr}")

    # Step 2: Transcribe audio
    print("Transcribing audio...")
    result = model.transcribe(audio_path, word_timestamps=True)
    segments = result["segments"]

    # Step 3: Process audio to beep abusive words
    print("Processing audio...")
    audio = AudioSegment.from_file(audio_path, format="wav")
    audio_raw = np.array(audio.get_array_of_samples())
    sample_rate = audio.frame_rate
    
    segments_to_beep = []
    for segment in segments:
        for word in segment["words"]:
            word_text = word["word"].strip().lower()
            if profanity.contains_profanity(word_text):
                start_ms = int(word["start"] * 1000)
                end_ms = int(word["end"] * 1000)
                segments_to_beep.append((start_ms, end_ms))
                print(f"Found abusive word '{word_text}' at {word['start']}s - {word['end']}s")

    if segments_to_beep:
        beep_samples = np.array(BEEP.get_array_of_samples())
        if device == "cuda":
            audio_raw = torch.from_numpy(audio_raw).cuda()
            beep_samples = torch.from_numpy(beep_samples).cuda()
            for start_ms, end_ms in sorted(segments_to_beep):
                start_sample = int(start_ms * sample_rate / 1000)
                end_sample = int(end_ms * sample_rate / 1000)
                duration = end_sample - start_sample
                beep_segment = beep_samples[:duration] if duration <= len(beep_samples) else beep_samples.repeat((duration // len(beep_samples)) + 1)[:duration]
                audio_raw[start_sample:end_sample] = beep_segment
            audio_raw = audio_raw.cpu().numpy()
        else:
            for start_ms, end_ms in sorted(segments_to_beep):
                start_sample = int(start_ms * sample_rate / 1000)
                end_sample = int(end_ms * sample_rate / 1000)
                duration = end_sample - start_sample
                beep_segment = beep_samples[:duration] if duration <= len(beep_samples) else np.tile(beep_samples, (duration // len(beep_samples)) + 1)[:duration]
                audio_raw[start_sample:end_sample] = beep_segment

    audio = AudioSegment(audio_raw.tobytes(), frame_rate=sample_rate, sample_width=audio.sample_width, channels=1)
    
    # Step 4: Export modified audio
    print("Exporting audio...")
    audio.export(audio_path, format="wav")

    # Step 5: Merge back with video
    print("Merging audio with video...")
    ffmpeg_cmd = [
        "ffmpeg", "-i", input_path, "-i", audio_path, 
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",  # H.264 video
        "-c:a", "aac", "-b:a", "128k",                       # AAC audio
        "-map", "0:v:0", "-map", "1:a:0", "-y", output_path
    ]
    try:
        subprocess.run(ffmpeg_cmd, check=True, stderr=subprocess.PIPE, universal_newlines=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error merging audio and video: {e.stderr}")

    if os.path.exists(audio_path):
        os.remove(audio_path)

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    filename = secure_filename(file.filename)
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    output_filename = f"processed_{filename}"
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
    
    file.save(input_path)
    
    try:
        process_video(input_path, output_path)
        return jsonify({"message": "Video processed successfully", "output_url": f"/download/{output_filename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)

@app.route('/download/<filename>', methods=['GET'])
def download_video(filename):
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(output_path):
        return send_file(output_path, as_attachment=True, mimetype='video/mp4')
    return jsonify({"error": "File not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)