import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { composeDictationText, formatTranscript } from '@/domain/transcript';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

declare const require: (moduleName: string) => unknown;

type SpeechRecognitionPackage = typeof import('expo-speech-recognition');

export type DictationStatus = 'idle' | 'starting' | 'listening' | 'stopping' | 'error';

interface StartPosition {
  prefix: string;
  suffix: string;
}

interface UseDictationOptions {
  language: string;
  smartPunctuation: boolean;
  removeFillers: boolean;
  contextualStrings?: readonly string[];
  onText: (text: string) => void;
  onEnd?: () => void;
}

export interface DictationAvailability {
  available: boolean;
  reason: string | null;
}

let cachedModule: SpeechRecognitionPackage | null | undefined;

function resolveSpeechModule(): SpeechRecognitionPackage | null {
  if (cachedModule !== undefined) return cachedModule;
  try {
    cachedModule = require('expo-speech-recognition') as SpeechRecognitionPackage;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

function webSpeechSupported(): boolean {
  if (Platform.OS !== 'web') return true;
  const scope = globalThis as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(scope.SpeechRecognition || scope.webkitSpeechRecognition);
}

function resolveAvailability(): DictationAvailability {
  const module = resolveSpeechModule();
  if (!module) {
    const expoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    return {
      available: false,
      reason: expoGo
        ? 'Voice needs a development build. Expo Go does not include a speech engine. Run “npx expo run:ios” or “npx expo run:android”, or try d-dairy in Chrome on the web.'
        : 'The speech engine is not included in this build. Rebuild the app with the expo-speech-recognition plugin to dictate.',
    };
  }

  if (!webSpeechSupported()) {
    return {
      available: false,
      reason: 'This browser does not support live speech recognition. Chrome and Edge do. You can still type here.',
    };
  }

  try {
    if (!module.ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      return {
        available: false,
        reason: 'Speech recognition is not available on this device right now. You can still type instead.',
      };
    }
  } catch {
    return {
      available: false,
      reason: 'The speech engine could not start on this device. You can still type instead.',
    };
  }

  return { available: true, reason: null };
}

function friendlyError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone or speech access is off. Enable it in your device settings, then try again.';
    case 'no-speech':
    case 'speech-timeout':
      return 'I did not catch that. Try again a little closer to the microphone.';
    case 'network':
      return 'Speech recognition needs a connection right now. You can keep writing instead.';
    case 'language-not-supported':
      return 'This language is not supported by your device’s speech engine. Choose another in Settings.';
    case 'busy':
      return 'The speech engine is busy. Give it a moment and try again.';
    case 'audio-capture':
      return 'The microphone is unavailable. Check that no other app is using it.';
    case 'interrupted':
      return 'Your microphone was interrupted. Tap the mic to pick up where you left off.';
    default:
      return 'Dictation stopped unexpectedly. Your words are safe — tap the mic to continue.';
  }
}

/**
 * A long-form dictation controller built on the device's native speech engine.
 * Final segments are appended safely (including Android's segmented results),
 * interim results are composed live, and unexpected service endings restart
 * automatically until the person taps Done.
 */
export function useDictation({
  language,
  smartPunctuation,
  removeFillers,
  contextualStrings = [],
  onText,
  onEnd,
}: UseDictationOptions) {
  const [status, setStatus] = useState<DictationStatus>('idle');
  const [volume, setVolume] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [interimPreview, setInterimPreview] = useState('');
  const [stablePreview, setStablePreview] = useState('');

  const statusRef = useRef<DictationStatus>('idle');
  const activeRef = useRef(false);
  const manualStopRef = useRef(false);
  const erroredRef = useRef(false);
  const mountedRef = useRef(true);
  const prefixRef = useRef('');
  const suffixRef = useRef('');
  const finalsRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const startedAtRef = useRef<number | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef({ language, smartPunctuation, removeFillers, contextualStrings });
  const onTextRef = useRef(onText);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    optionsRef.current = { language, smartPunctuation, removeFillers, contextualStrings };
    onTextRef.current = onText;
    onEndRef.current = onEnd;
  }, [contextualStrings, language, onEnd, onText, removeFillers, smartPunctuation]);

  const availability = useMemo(() => resolveAvailability(), []);
  const module = useMemo(() => resolveSpeechModule(), []);

  const setStatusSafe = useCallback((next: DictationStatus) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const emit = useCallback((finalize: boolean) => {
    const { smartPunctuation: punctuation, removeFillers: fillers } = optionsRef.current;
    const text = composeDictationText({
      prefix: prefixRef.current,
      suffix: suffixRef.current,
      finalSegments: finalsRef.current,
      interim: interimRef.current,
      smartPunctuation: punctuation,
      removeFillers: fillers,
      finalize,
    });
    onTextRef.current(text);
    setStablePreview(finalsRef.current.join(' ').trim());
    setInterimPreview(interimRef.current.trim());
  }, []);

  const clearTimers = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    restartTimerRef.current = null;
    finishTimerRef.current = null;
  }, []);

  const appendFinal = useCallback(
    (transcript: string) => {
      const normalized = transcript.replace(/\s+/g, ' ').trim();
      if (!normalized) return;

      const formatted = formatTranscript(normalized, {
        smartPunctuation: optionsRef.current.smartPunctuation,
        removeFillers: optionsRef.current.removeFillers,
        finalize: optionsRef.current.smartPunctuation,
      });
      if (!formatted) return;

      const joined = finalsRef.current.join(' ').trim();
      if (joined && formatted.toLowerCase() === joined.toLowerCase()) return;
      if (joined && formatted.toLowerCase().startsWith(joined.toLowerCase())) {
        finalsRef.current = [formatted];
        return;
      }
      if (joined && joined.toLowerCase().startsWith(formatted.toLowerCase())) return;

      finalsRef.current = [...finalsRef.current, formatted];
    },
    [],
  );

  const finish = useCallback(() => {
    clearTimers();
    if (!mountedRef.current) return;
    if (interimRef.current.trim()) {
      appendFinal(interimRef.current);
      interimRef.current = '';
    }
    activeRef.current = false;
    manualStopRef.current = false;
    setVolume(0);
    emit(true);
    setStatusSafe('idle');
    onEndRef.current?.();
    AccessibilityInfo.announceForAccessibility('Dictation stopped');
  }, [appendFinal, clearTimers, emit, setStatusSafe]);

  const startEngine = useCallback(() => {
    if (!module) return;
    const options = optionsRef.current;
    try {
      module.ExpoSpeechRecognitionModule.start({
        lang: options.language,
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        addsPunctuation: options.smartPunctuation,
        iosTaskHint: 'dictation',
        contextualStrings: [...new Set(options.contextualStrings)].slice(0, 20),
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 90,
        },
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1800,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1800,
        },
      });
    } catch {
      activeRef.current = false;
      setError('Dictation could not start. Close and reopen the app, then try again.');
      setStatusSafe('error');
    }
  }, [module, setStatusSafe]);

  const stop = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'error') return;
    manualStopRef.current = true;
    activeRef.current = false;
    clearTimers();
    setStatusSafe('stopping');
    try {
      module?.ExpoSpeechRecognitionModule.stop();
    } catch {
      finish();
      return;
    }

    finishTimerRef.current = setTimeout(finish, 1600);
  }, [clearTimers, finish, module, setStatusSafe]);

  const start = useCallback(
    async (position: StartPosition = { prefix: '', suffix: '' }) => {
      if (statusRef.current === 'starting' || statusRef.current === 'listening') return;
      clearTimers();
      setError(null);
      setErrorCode(null);
      erroredRef.current = false;
      setInterimPreview('');
      setStablePreview('');
      setElapsedMs(0);

      if (!availability.available || !module) {
        setError(availability.reason);
        setStatusSafe('error');
        return;
      }

      prefixRef.current = position.prefix;
      suffixRef.current = position.suffix;
      finalsRef.current = [];
      interimRef.current = '';
      manualStopRef.current = false;
      activeRef.current = true;
      setStatusSafe('starting');

      try {
        const permission = await module.ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          activeRef.current = false;
          setError(
            'd-dairy needs microphone and speech recognition access. You can enable both in Settings.',
          );
          setStatusSafe('error');
          return;
        }
      } catch {
        activeRef.current = false;
        setError('d-dairy could not ask for microphone access. You can still type instead.');
        setStatusSafe('error');
        return;
      }

      if (!activeRef.current) return;
      startedAtRef.current = Date.now();
      startEngine();
    },
    [availability, clearTimers, module, setStatusSafe, startEngine],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!module) {
      return () => {
        mountedRef.current = false;
      };
    }

    const speech = module.ExpoSpeechRecognitionModule;

    const startListener = speech.addListener('start', () => {
      if (!activeRef.current) return;
      startedAtRef.current = startedAtRef.current ?? Date.now();
      setStatusSafe('listening');
      AccessibilityInfo.announceForAccessibility('Listening. Speak now.');
    });

    const resultListener = speech.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
      if (!activeRef.current && !manualStopRef.current) return;
      const transcript = event.results[0]?.transcript ?? '';
      if (!transcript.trim()) return;

      if (event.isFinal) {
        appendFinal(transcript);
        interimRef.current = '';
      } else {
        interimRef.current = transcript;
      }
      emit(false);
    });

    const errorListener = speech.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' && manualStopRef.current) return;
      clearTimers();
      activeRef.current = false;
      erroredRef.current = true;
      setVolume(0);
      setError(friendlyError(event.error));
      setErrorCode(event.error);
      if (interimRef.current.trim()) {
        appendFinal(interimRef.current);
        interimRef.current = '';
        emit(true);
      }
      setStatusSafe('error');
      AccessibilityInfo.announceForAccessibility('Dictation stopped');
    });

    const endListener = speech.addListener('end', () => {
      if (!mountedRef.current) return;

      if (activeRef.current) {
        // Android 12 and some web engines end a session on every silence.
        // Keep the person's dictation flowing by starting a fresh segment.
        if (interimRef.current.trim()) {
          appendFinal(interimRef.current);
          interimRef.current = '';
          emit(false);
        }
        setStatusSafe('starting');
        setVolume(0);
        restartTimerRef.current = setTimeout(() => {
          if (activeRef.current) startEngine();
        }, 280);
        return;
      }

      if (erroredRef.current) {
        clearTimers();
        setVolume(0);
        return;
      }

      finish();
    });

    const volumeListener = speech.addListener(
      'volumechange',
      (event: { value: number }) => {
        if (!activeRef.current) return;
        const normalized = Math.max(0, Math.min(1, (event.value + 2) / 12));
        setVolume(normalized);
      },
    );

    return () => {
      mountedRef.current = false;
      clearTimers();
      activeRef.current = false;
      startListener.remove();
      resultListener.remove();
      errorListener.remove();
      endListener.remove();
      volumeListener.remove();
      try {
        speech.abort();
      } catch {
        // The native module may already be inactive.
      }
    };
  }, [appendFinal, clearTimers, emit, finish, module, setStatusSafe, startEngine]);

  useEffect(() => {
    if (status !== 'listening' && status !== 'stopping') return;
    const tick = () => {
      if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [status]);

  return {
    status,
    isActive: status === 'starting' || status === 'listening' || status === 'stopping',
    isListening: status === 'listening',
    volume,
    elapsedMs,
    error,
    errorCode,
    interimPreview,
    stablePreview,
    availability,
    start,
    stop,
  };
}
