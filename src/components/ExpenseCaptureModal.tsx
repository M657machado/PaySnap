import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  FileText,
  Loader2,
  Mic,
  Square,
  Upload,
  X,
} from 'lucide-react';
import type { ExpenseCategory, Language } from '../lib/finance';
import { COPY } from '../lib/i18n';

export interface AnalyzedExpenseResult {
  amount: number;
  merchant: string;
  category: ExpenseCategory;
  ai_roast: string;
}

interface ExpenseCaptureModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onExpenseCreated: (expense: AnalyzedExpenseResult) => void | Promise<void>;
}

type CaptureTab = 'photo' | 'voice' | 'text';

function stripDataUrlPrefix(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function blobToBase64(blob: Blob): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read file.'));
        return;
      }
      const parsed = stripDataUrlPrefix(reader.result);
      if (!parsed) {
        reject(new Error('Unsupported media format.'));
        return;
      }
      resolve(parsed);
    };
    reader.onerror = () => reject(new Error('Failed to read media.'));
    reader.readAsDataURL(blob);
  });
}

export function ExpenseCaptureModal({
  isOpen,
  lang,
  onClose,
  onExpenseCreated,
}: ExpenseCaptureModalProps) {
  const t = COPY[lang];
  const [tab, setTab] = useState<CaptureTab>('photo');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoPayload, setPhotoPayload] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioPayload, setAudioPayload] = useState<{
    base64: string;
    mimeType: string;
    url: string;
  } | null>(null);

  const [textNote, setTextNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setRecordSeconds(0);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const encoded = await blobToBase64(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreviewUrl(preview);
      setPhotoPayload(encoded);
    } catch {
      setError(
        lang === 'pt-BR'
          ? 'Não foi possível ler a imagem selecionada.'
          : 'Could not read the selected image.'
      );
    }
  };

  const startVoiceRecording = async () => {
    setError(null);
    setAudioPayload(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setError(t.micUnavailableError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const encoded = await blobToBase64(blob);
        setAudioPayload({
          ...encoded,
          url: URL.createObjectURL(blob),
        });
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError(t.micUnavailableError);
    }
  };

  const stopVoiceRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const submitAnalysis = async (payload: {
    mediaBase64?: string;
    mimeType?: string;
    textNote?: string;
  }) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/expenses/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : lang === 'pt-BR'
              ? 'Falha ao analisar gasto com a IA.'
              : 'Failed to analyze expense with AI.'
        );
      }

      if (!data.expense) {
        throw new Error('Unexpected response from AI analyzer.');
      }

      await onExpenseCreated(data.expense as AnalyzedExpenseResult);
      setPhotoPreviewUrl(null);
      setPhotoPayload(null);
      setAudioPayload(null);
      setTextNote('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to analyze expense right now.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.captureTitle}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full max-w-md rounded-t-[24px] sm:rounded-[20px] bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t.captureTitle}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t.captureSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        {!isAnalyzing && (
          <div
            role="tablist"
            aria-label="Capture mode"
            className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-[#F4F6F9] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'photo'}
              onClick={() => {
                setTab('photo');
                setError(null);
              }}
              className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'photo'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>{t.photoTab}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === 'voice'}
              onClick={() => {
                setTab('voice');
                setError(null);
              }}
              className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'voice'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>{t.voiceTab}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === 'text'}
              onClick={() => {
                setTab('text');
                setError(null);
              }}
              className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'text'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{t.textTab}</span>
            </button>
          </div>
        )}

        {/* Loading State or Tab Body */}
        {isAnalyzing ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-[#F4F6F9] px-6 py-12 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D4ED8]/10 text-[#1D4ED8]">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <p className="mt-4 font-display text-base font-bold text-slate-900">
              {t.analyzingLabel}
            </p>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
              {t.analyzingSubtitle}
            </p>
          </div>
        ) : (
          <div className="mt-5">
            {tab === 'photo' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />

              {photoPreviewUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={photoPreviewUrl}
                    alt={t.uploadPhotoTitle}
                    className="max-h-56 w-full object-contain"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-[#F4F6F9]/70 px-4 py-8 text-center hover:border-[#1D4ED8] hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <Upload className="mx-auto h-7 w-7 text-[#1D4ED8]" />
                  <p className="mt-2.5 text-sm font-semibold text-slate-800">
                    {t.uploadPhotoTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.uploadPhotoHint}
                  </p>
                </button>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] flex-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {photoPreviewUrl ? t.changePhotoBtn : t.choosePhotoBtn}
                </button>

                {photoPayload && (
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() =>
                      submitAnalysis({
                        mediaBase64: photoPayload.base64,
                        mimeType: photoPayload.mimeType,
                      })
                    }
                    className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t.analyzingLabel}</span>
                      </>
                    ) : (
                      <span>{t.analyzePhotoBtn}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'voice' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9]/70 px-4 py-7 text-center">
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                    isRecording
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#1D4ED8]/10 text-[#1D4ED8]'
                  }`}
                >
                  {isRecording ? (
                    <Square className="h-5 w-5 fill-current" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {isRecording ? t.recordingNow : t.voiceReadyHint}
                </p>

                {isRecording && (
                  <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-rose-600">
                    00:{String(recordSeconds).padStart(2, '0')}
                  </p>
                )}

                {audioPayload && !isRecording && (
                  <audio
                    controls
                    src={audioPayload.url}
                    className="mx-auto mt-4 w-full max-w-xs"
                  />
                )}
              </div>

              <div className="flex gap-2.5">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="min-h-[48px] w-full rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 cursor-pointer"
                  >
                    {t.stopRecording}
                  </button>
                ) : audioPayload ? (
                  <>
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="min-h-[48px] flex-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {t.reRecordBtn}
                    </button>
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() =>
                        submitAnalysis({
                          mediaBase64: audioPayload.base64,
                          mimeType: audioPayload.mimeType,
                        })
                      }
                      className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t.analyzingLabel}</span>
                        </>
                      ) : (
                        <span>{t.analyzeVoiceBtn}</span>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-blue-800 cursor-pointer"
                  >
                    <Mic className="h-4 w-4" />
                    <span>{t.startRecording}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'text' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitAnalysis({ textNote });
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="expense-text-note"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  {t.textInputLabel}
                </label>
                <textarea
                  id="expense-text-note"
                  rows={3}
                  value={textNote}
                  onChange={(e) => setTextNote(e.target.value)}
                  placeholder={t.textInputPlaceholder}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-[#F4F6F9]/50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !textNote.trim()}
                className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.analyzingLabel}</span>
                  </>
                ) : (
                  <span>{t.analyzeTextBtn}</span>
                )}
              </button>
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              {error}
            </p>
          )}
            </div>
          )}
      </div>
    </div>
  );
}
