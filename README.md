# 🔊 Video Profanity Beep Editor App

This is a Flask-based application that automatically detects and censors profane words in the audio of a video file using a beep sound.

The app uses:
- 🎙️ [OpenAI Whisper](https://github.com/openai/whisper) for speech-to-text transcription
- 🤬 [`better_profanity`](https://github.com/snguyenthanh/better-profanity) for profanity detection
- 🎛️ [PyDub](https://github.com/jiaaro/pydub) for audio processing
- 🎥 `ffmpeg` for video/audio extraction and merging

---

## 🛠 Features

- Upload a video file
- Automatically extract audio and transcribe it
- Detect and censor profane words using a beep sound
- Export a clean, processed video with censored audio

---

## 📸 Demo

https://github.com/user-attachments/assets/b324f2d8-0440-4559-8205-9fb48193b7ae

---

## 🚀 Installation

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/video-profanity-beep-editor-app.git
cd video-profanity-beep-editor-app/backend
```

### 2. Set up a virtual environment
```bash
python -m venv venv
# On Windows: venv\Scripts\activate
```
### 3. Install dependencies
```bash
pip install -r requirements.txt
```
Make sure ffmpeg is installed and accessible from your system path.

### 4. Run the server
```bash
python app.py
```
The server will start at http://0.0.0.0:5000/

## Outputs
![Screenshot 2025-05-30 180430](https://github.com/user-attachments/assets/3bf213e8-40c9-4692-9434-435d7415f3a5)
![Screenshot 2025-05-30 180251](https://github.com/user-attachments/assets/bca52309-e836-4e51-be93-4238cd983e8a)
