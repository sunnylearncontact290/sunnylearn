import { apiService } from './api';

export const DEFAULT_JAPANESE_VOICE = 'ja-JP-NanamiNeural';
export const MALE_JAPANESE_VOICE = 'ja-JP-KeitaNeural';

export interface SpeechState {
  currentId: string | null;
  loadingId: string | null;
  isPlaying: boolean;
  error: string | null;
  errorId: string | null;
}

type SpeechSubscriber = (state: SpeechState) => void;

export interface PlaySpeechOptions {
  id?: string;
  reading?: string;
  voice?: string;
  rate?: number;
  audioUri?: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Recursively extracts and reconstructs a complete Japanese sentence from any representation:
 * string, array of strings/nodes, or React children/objects.
 * Guarantees zero truncation and joins all parts in original order without unwanted spaces.
 */
export function extractFullJapaneseSentence(input: any): string {
  if (input == null) return '';
  if (typeof input === 'string') return input;
  if (typeof input === 'number') return String(input);
  if (Array.isArray(input)) {
    return input.map(item => extractFullJapaneseSentence(item)).join('');
  }
  if (typeof input === 'object') {
    if (typeof input.props?.children !== 'undefined') {
      return extractFullJapaneseSentence(input.props.children);
    }
    if (typeof input.japanese === 'string') return input.japanese;
    if (typeof input.text === 'string') return input.text;
    if (typeof input.sentence === 'string') return input.sentence;
  }
  return String(input);
}

/**
 * Detects whether a Japanese text string represents a sentence or multi-word phrase
 * rather than an isolated vocabulary/kanji word.
 */
export function isJapaneseSentence(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  // 1. Sentence ending punctuation (Japanese or Latin)
  if (/[。！？!?\n]/.test(t)) return true;
  // 2. Contains spaces between Japanese segments (typical in textbook sentences/readings)
  if (/\s+/.test(t) && t.length > 3) return true;
  // 3. Contains dialogue or speaker prefix (e.g. "A: ", "田中: ")
  if (/^[A-Za-z\u3040-\u30ff\u4e00-\u9fa5]+[:：]/.test(t)) return true;
  // 4. Grammar structures and auxiliary verbs characteristic of full sentences
  if (t.length >= 6 && /(?:です|ます|でした|ました|ません|ない|たい|ある|いる|こと|もの|から|ので|けど|て|で|ば|たら|なら|ちゃいけない|じゃいけない)[。！？!?]?$/.test(t)) {
    return true;
  }
  // 5. Length > 8 is almost universally a phrase or sentence
  if (t.length > 8) return true;
  return false;
}

/**
 * Strips ruby tags, furigana brackets, parenthetical translations,
 * and markdown notation to produce clean Japanese text for TTS.
 * Guarantees the voice pronounces the COMPLETE sentence from beginning to end
 * without truncation, duplicate readings, or bracket utterances.
 *
 * Example:
 * ここで写真を撮っちゃいけない。 -> ここで写真を撮っちゃいけない。
 * 安全【あんぜん】 -> あんぜん
 * 手続き【てつづき】 -> てつづき
 * <ruby>安全<rt>あんぜん</rt></ruby> -> 安全
 */
export function cleanJapaneseText(text: any, reading?: string): string {
  const fullText = extractFullJapaneseSentence(text);

  // If text is a full sentence or multi-word phrase:
  // ALWAYS prioritize the complete original sentence from beginning to end!
  const isSentence = isJapaneseSentence(fullText) || (reading ? isJapaneseSentence(reading) : false);

  if (fullText && isSentence) {
    let s = fullText;

    // 1. Ruby tags: retain base Japanese text from <ruby>BASE<rt>READING</rt></ruby>, discard duplicate <rt>
    s = s.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>[\s\S]*?<\/rt>[\s\S]*?<\/ruby>/gi, '$1');
    s = s.replace(/<rt[^>]*>[\s\S]*?<\/rt>/gi, '');
    s = s.replace(/<[^>]+>/g, '');

    // 2. Japanese reading inside brackets: e.g. 写真【しゃしん】 or 写真(しゃしん)
    // Retain base Japanese text ($1) to ensure authentic neural sentence reading without duplicate bracket utterance
    s = s.replace(/([\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]+[\u3041-\u3096]*)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・\.\-]+)\s*[）\)\]】]/gu, '$1');

    // 3. Remove non-Japanese parenthetical text like (Сайн байна уу), (noun), etc.
    s = s.replace(/[（\(][^ぁ-んァ-ヶ一-龯]*[）\)]/gu, '');

    // 4. Remove standalone bracket characters
    s = s.replace(/[【】\[\]]/g, '');

    // 5. Remove markdown formatting like **bold** or *italic*
    s = s.replace(/[\*\_~`#]/g, '');

    // 6. Remove emoji characters
    s = s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '');

    // 7. Normalize whitespace: keep Japanese sentence contiguous without extra spaces
    s = s.replace(/([\u3040-\u30ff\u4e00-\u9fa5])\s+([\u3040-\u30ff\u4e00-\u9fa5])/g, '$1$2');
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  }

  // If text is NOT a sentence (e.g. single vocabulary item or single kanji):
  // Check explicit kana reading:
  if (reading && typeof reading === 'string') {
    let r = reading.replace(/[—–\-－]/g, ' ').trim();
    if (r) {
      // If reading is a sentence with spaces: concatenate ALL parts without dropping any segment!
      if (isJapaneseSentence(r)) {
        const parts = r.split(/\s+/).map(p => p.replace(/[\(\)\[\]（）【】\.\-・~〜]/g, '').trim());
        const concatenated = parts.join('');
        if (concatenated) return concatenated;
      }

      // For single kanji/vocab with alternative readings (e.g. "ひ, -び, -か"):
      const parts = r.split(/[,、\/\s]+/);
      for (const p of parts) {
        // Strip okurigana markers, dots, hyphens, parentheses: まな(ぶ) -> まなぶ, あ-たる -> あたる, お.きる -> おきる
        const cleaned = p.replace(/[\(\)\[\]（）【】\.\-・~〜]/g, '').trim();
        if (/^[ぁ-んァ-ヶー]+$/.test(cleaned)) {
          return cleaned;
        }
      }
    }
  }

  if (!fullText) return '';
  let s = fullText;

  // 2. Ruby tags: replace <ruby>X<rt>Y</rt></ruby> with reading Y
  s = s.replace(/<ruby[^>]*>(?:(?!<rt).)*<rt[^>]*>([^<]+)<\/rt>.*?<\/ruby>/gi, '$1');
  s = s.replace(/<rt[^>]*>([^<]+)<\/rt>/gi, '$1');
  s = s.replace(/<[^>]+>/g, '');

  // 3. Japanese reading inside brackets: e.g. 安全【あんぜん】 or 手続き【てつづき】 or 安全(あんぜん)
  // Replace with reading ($2) so the neural voice pronounces the authentic reading ONCE without repeating!
  s = s.replace(/([\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]+[\u3041-\u3096]*)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・\.\-]+)\s*[）\)\]】]/gu, (_, _kanji, kana) => {
    return kana.replace(/[\(\)\[\]（）【】\.\-・~〜]/g, '').trim();
  });

  // 4. Standalone bracketed kana: e.g. 【あんぜん】 or [あんぜん] or (あんぜん)
  s = s.replace(/^[（\(\[【]\s*([ぁ-んァ-ヶー]+)\s*[）\)\]】]$/u, '$1');

  // 5. Remove non-Japanese parenthetical text like (Сайн байна уу), (noun), etc.
  s = s.replace(/[（\(][^ぁ-んァ-ヶ一-龯]*[）\)]/gu, '');

  // 6. Remove standalone bracket characters
  s = s.replace(/[【】\[\]]/g, '');

  // 7. Remove markdown formatting like **bold** or *italic*
  s = s.replace(/[\*\_~`#]/g, '');

  // 8. Remove emoji characters
  s = s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '');

  // 9. Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Extracts the single authentic, natural Japanese pronunciation reading for a Kanji.
 * Prioritizes clean primary Kunyomi reading, then Onyomi reading.
 * Strips dictionary annotations, dots, hyphens, and okurigana parens:
 * e.g. まな(ぶ) -> まなぶ, ひ, -び, -か -> ひ, テキ -> テキ.
 */
export function extractKanjiPronunciation(kanji: { kanji: string; kunyomi?: string; onyomi?: string }): { text: string; reading: string } {
  // 1. Check Kunyomi first
  const cleanKunyomi = (kanji.kunyomi || '').replace(/[—–\-－]/g, ' ').trim();
  if (cleanKunyomi) {
    const parts = cleanKunyomi.split(/[,、\/\s]+/);
    for (const p of parts) {
      const cleaned = p.replace(/[\(\)\[\]（）【】\.\-・~〜]/g, '').trim();
      if (/^[ぁ-んァ-ヶー]+$/.test(cleaned)) {
        return { text: kanji.kanji, reading: cleaned };
      }
    }
  }

  // 2. Check Onyomi next
  const cleanOnyomi = (kanji.onyomi || '').replace(/[—–\-－]/g, ' ').trim();
  if (cleanOnyomi) {
    const parts = cleanOnyomi.split(/[,、\/\s]+/);
    for (const p of parts) {
      const cleaned = p.replace(/[\(\)\[\]（）【】\.\-・~〜]/g, '').trim();
      if (/^[ぁ-んァ-ヶー]+$/.test(cleaned)) {
        return { text: kanji.kanji, reading: cleaned };
      }
    }
  }

  return { text: kanji.kanji, reading: kanji.kanji };
}

/**
 * Extracts clean, natural Japanese pronunciation for a Vocabulary item.
 * Always guarantees single pronunciation without duplicate readings or bracket utterances.
 */
export function extractVocabPronunciation(vocab: { japanese: string; reading?: string }): { text: string; reading: string } {
  const reading = cleanJapaneseText(vocab.japanese, vocab.reading);
  return {
    text: vocab.japanese,
    reading: reading || vocab.japanese
  };
}

/**
 * Centralized Japanese Neural Speech Service.
 * Single source of truth for all Japanese audio across the platform.
 * Ensures identical human-like neural voice, zero robotic browser fallbacks,
 * audio prefetching, and instant cached playback.
 */
class CentralizedSpeechService {
  // In-memory audio cache: cacheKey -> base64 data URI
  private audioCache = new Map<string, string>();
  // In-flight request deduplication
  private pendingRequests = new Map<string, Promise<string | null>>();
  // Centralized single HTML audio instance to prevent overlapping playback
  private audioPlayer: HTMLAudioElement | null = null;

  // Global state
  private state: SpeechState = {
    currentId: null,
    loadingId: null,
    isPlaying: false,
    error: null,
    errorId: null
  };

  // Subscribers
  private subscribers = new Set<SpeechSubscriber>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioPlayer = new Audio();
      this.audioPlayer.preload = 'auto';
    }
  }

  public subscribe(subscriber: SpeechSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.state);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify() {
    this.subscribers.forEach(sub => {
      try {
        sub(this.state);
      } catch (err) {
        console.error('[SpeechService] Subscriber error:', err);
      }
    });
  }

  private setState(partial: Partial<SpeechState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public getState(): SpeechState {
    return this.state;
  }

  public isPlaying(idOrText?: string): boolean {
    if (!this.state.isPlaying) return false;
    if (!idOrText) return this.state.isPlaying;
    return this.state.currentId === idOrText;
  }

  public isLoading(idOrText?: string): boolean {
    if (!this.state.loadingId) return false;
    if (!idOrText) return !!this.state.loadingId;
    return this.state.loadingId === idOrText;
  }

  public hasError(idOrText: string): boolean {
    return this.state.errorId === idOrText;
  }

  public getCurrentPlayingId(): string | null {
    return this.state.currentId;
  }

  /**
   * Resolve canonical voice name.
   */
  private resolveVoice(voice?: string): string {
    if (voice === 'Puck' || voice === 'Fenrir' || voice === 'Charon' || voice === 'male' || voice === MALE_JAPANESE_VOICE) {
      return MALE_JAPANESE_VOICE;
    }
    return DEFAULT_JAPANESE_VOICE;
  }

  /**
   * Stop any current audio playback cleanly.
   */
  public stop(): void {
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch {}
    }

    this.setState({
      currentId: null,
      loadingId: null,
      isPlaying: false
    });
  }

  /**
   * Prefetches audio in the background for high-priority items
   * (e.g. Daily Vocabulary, Daily Kanji) so clicking starts instantly in 0ms.
   */
  public async prefetch(text: string, reading?: string, voice?: string): Promise<void> {
    const clean = cleanJapaneseText(text, reading);
    if (!clean) return;

    const canonicalVoice = this.resolveVoice(voice);
    const cacheKey = `${canonicalVoice}:${clean}`;

    if (this.audioCache.has(cacheKey) || this.pendingRequests.has(cacheKey)) {
      return;
    }

    const reqPromise = (async () => {
      try {
        const res = await apiService.generateTTS({ text: clean, voice: canonicalVoice });
        if (res && res.success && res.audioUri) {
          this.audioCache.set(cacheKey, res.audioUri);
          return res.audioUri;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, reqPromise);
  }

  /**
   * Main play method for natural Japanese speech across the entire website.
   * Uses the single centralized neural voice engine.
   * If TTS fails, reports error state rather than degrading to a robotic browser voice.
   */
  public async play(text: string, options: PlaySpeechOptions = {}): Promise<void> {
    const {
      id = text,
      reading,
      voice,
      rate = 1.0,
      audioUri: directAudioUri,
      onStart,
      onEnd,
      onError
    } = options;

    const clean = cleanJapaneseText(text, reading);
    if (!clean || clean.length === 0) {
      return;
    }

    console.log('[TTS] Speaking text:', clean);

    // Toggle off if clicking the currently playing audio
    if (this.state.isPlaying && this.state.currentId === id) {
      this.stop();
      return;
    }

    // Stop any previously playing audio immediately
    this.stop();

    const canonicalVoice = this.resolveVoice(voice);
    const cacheKey = `${canonicalVoice}:${clean}`;

    // If a direct audio URI was passed in (e.g. pre-generated from server response)
    if (directAudioUri) {
      this.audioCache.set(cacheKey, directAudioUri);
      await this.playAudioUri(directAudioUri, id, rate, onStart, onEnd, onError);
      return;
    }

    this.setState({
      loadingId: id,
      error: null,
      errorId: null
    });

    try {
      let audioUri = this.audioCache.get(cacheKey) || null;

      if (!audioUri) {
        // In-flight request deduplication
        let reqPromise = this.pendingRequests.get(cacheKey);
        if (!reqPromise) {
          reqPromise = (async () => {
            try {
              const res = await apiService.generateTTS({ text: clean, voice: canonicalVoice });
              if (res && res.success && res.audioUri) {
                return res.audioUri;
              }
              return null;
            } catch (err) {
              console.warn('[SpeechService] TTS request failed:', err);
              return null;
            } finally {
              this.pendingRequests.delete(cacheKey);
            }
          })();
          this.pendingRequests.set(cacheKey, reqPromise);
        }

        audioUri = await reqPromise;
        if (audioUri) {
          this.audioCache.set(cacheKey, audioUri);
        }
      }

      if (audioUri) {
        await this.playAudioUri(audioUri, id, rate, onStart, onEnd, onError);
        return;
      }

      // If neural audio generation failed (network drop or server error):
      // NEVER degrade to robotic browser voice. Set clear error state for user retry.
      const errorMsg = 'Дуу тоглуулахад алдаа гарлаа. Дахин дарж оролдоно уу.';
      this.setState({
        loadingId: null,
        currentId: null,
        isPlaying: false,
        error: errorMsg,
        errorId: id
      });
      onError?.(new Error(errorMsg));
    } catch (err: any) {
      console.warn('[SpeechService] Play error:', err);
      const errorMsg = err?.message || 'Дуу тоглуулахад алдаа гарлаа.';
      this.setState({
        loadingId: null,
        currentId: null,
        isPlaying: false,
        error: errorMsg,
        errorId: id
      });
      onError?.(err);
    }
  }

  private async playAudioUri(
    audioUri: string,
    id: string,
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!this.audioPlayer) {
      this.audioPlayer = new Audio();
    }

    const audio = this.audioPlayer;
    audio.pause();
    audio.currentTime = 0;
    audio.src = audioUri;
    audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));

    const handleEnded = () => {
      cleanup();
      this.setState({
        currentId: null,
        isPlaying: false,
        loadingId: null
      });
      onEnd?.();
    };

    const handleError = (e: any) => {
      cleanup();
      this.setState({
        currentId: null,
        isPlaying: false,
        loadingId: null,
        error: 'Дуу тоглуулах боломжгүй байна.',
        errorId: id
      });
      onError?.(e);
    };

    const cleanup = () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    try {
      this.setState({
        loadingId: null,
        currentId: id,
        isPlaying: true,
        error: null,
        errorId: null
      });
      onStart?.();
      await audio.play();
    } catch (playErr) {
      cleanup();
      this.setState({
        loadingId: null,
        currentId: null,
        isPlaying: false,
        error: 'Дуу тоглуулах үед алдаа гарлаа.',
        errorId: id
      });
      onError?.(playErr);
    }
  }

  // Compatibility helper
  public async speak(text: string, rate: number = 1.0, onStart?: () => void): Promise<void> {
    return this.play(text, { rate, onStart });
  }

  public cleanJapanese(text: string, reading?: string): string {
    return cleanJapaneseText(text, reading);
  }
}

export const speechService = new CentralizedSpeechService();
