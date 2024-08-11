import whisper
import sys

def transcribe_audio(audio_file):
    model = whisper.load_model("base")
    result = model.transcribe(audio_file)
    return result["text"]

if __name__ == "__main__":
    audio_file = sys.argv[1]
    transcript = transcribe_audio(audio_file)
    print(transcript)
