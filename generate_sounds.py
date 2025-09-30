import numpy as np
import wave
import os

def generate_tone(frequency, duration, sample_rate=44100, volume=0.3):
    """Generate a simple tone"""
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    wave_data = (volume * np.sin(2 * np.pi * frequency * t) * 32767).astype(np.int16)
    return wave_data

def save_wav(filename, wave_data, sample_rate=44100):
    """Save wave data to WAV file"""
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(wave_data.tobytes())

def main():
    # Create sounds directory if it doesn't exist
    os.makedirs('assets/sounds', exist_ok=True)
    
    # Jump sound - short, high frequency
    jump_data = generate_tone(800, 0.2)
    save_wav('assets/sounds/jump.wav', jump_data)
    
    # Correct sound - ascending tone
    correct_freqs = [440, 554, 659]  # A, C#, E
    correct_data = np.array([])
    for freq in correct_freqs:
        tone = generate_tone(freq, 0.15)
        correct_data = np.concatenate([correct_data, tone])
    save_wav('assets/sounds/correct.wav', correct_data)
    
    # Wrong sound - descending tone
    wrong_freqs = [659, 554, 440]  # E, C#, A
    wrong_data = np.array([])
    for freq in wrong_freqs:
        tone = generate_tone(freq, 0.15)
        wrong_data = np.concatenate([wrong_data, tone])
    save_wav('assets/sounds/wrong.wav', wrong_data)
    
    # Crash sound - low frequency noise
    crash_data = generate_tone(150, 0.3)
    save_wav('assets/sounds/crash.wav', crash_data)
    
    print("Placeholder sound files generated in assets/sounds/")

if __name__ == "__main__":
    main()
