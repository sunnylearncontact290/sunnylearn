// Speech service disabled - all audio and pronunciation TTS features have been removed globally.
class SpeechService {
  public async speak(_text: string, _rate: number = 1.0, _onStart?: () => void): Promise<void> {
    return Promise.resolve();
  }

  public stop(): void {}
}

export const speechService = new SpeechService();
