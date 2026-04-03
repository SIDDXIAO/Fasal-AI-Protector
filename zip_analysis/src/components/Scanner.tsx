import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ScanLine, AlertTriangle, CheckCircle, X, Leaf, FlaskConical, Pill, Camera } from 'lucide-react';

interface DiagnosisResult {
  disease: string;
  confidence: number;
  crop: string;
  severity: string;
  chemical: string;
  organic: string;
}

const mockDiseases: DiagnosisResult[] = [
  { disease: 'Tomato Late Blight', confidence: 94.7, crop: 'Tomato', severity: 'High', chemical: 'Mancozeb 75% WP @ 2.5g/L', organic: 'Neem oil spray + copper fungicide' },
  { disease: 'Potato Early Blight', confidence: 91.2, crop: 'Potato', severity: 'Medium', chemical: 'Chlorothalonil 75% WP @ 2g/L', organic: 'Trichoderma viride soil application' },
  { disease: 'Rice Blast', confidence: 96.1, crop: 'Rice', severity: 'High', chemical: 'Tricyclazole 75% WP @ 0.6g/L', organic: 'Pseudomonas fluorescens spray' },
  { disease: 'Wheat Leaf Rust', confidence: 89.5, crop: 'Wheat', severity: 'Medium', chemical: 'Propiconazole 25% EC @ 1ml/L', organic: 'Bordeaux mixture application' },
  { disease: 'Apple Scab', confidence: 92.8, crop: 'Apple', severity: 'Medium', chemical: 'Carbendazim 50% WP @ 1g/L', organic: 'Sulfur dust + compost tea spray' },
];

export function Scanner() {
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleScan = useCallback(() => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const randomResult = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      setResult(randomResult);
      setScanning(false);
    }, 3000);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }, [handleFile]);

  const clearAll = () => {
    setPreviewUrl(null);
    setResult(null);
    setScanning(false);
  };

  const severityColor = (sev: string) => {
    if (sev === 'High') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (sev === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  return (
    <section id="scanner" className="relative py-24 bg-[#030a01]">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs font-medium mb-4">
            <ScanLine className="w-3.5 h-3.5" />
            CNN-POWERED DIAGNOSIS
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Disease <span className="text-gradient">Scanner</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">
            Upload a photo of a diseased crop leaf. Our MobileNetV2 model identifies 38+ diseases instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`relative h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                dragActive
                  ? 'border-green-400 bg-green-500/10'
                  : previewUrl
                  ? 'border-green-500/30 bg-black/40'
                  : 'border-gray-700 bg-white/[0.02] hover:border-green-500/40 hover:bg-green-500/5'
              }`}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                  <button onClick={clearAll} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition">
                    <X className="w-4 h-4" />
                  </button>
                  {scanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                          animate={{ top: ['0%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              className="w-12 h-12 border-4 border-green-500/30 border-t-green-400 rounded-full mx-auto mb-3"
                            />
                            <p className="text-green-400 font-semibold">Analyzing...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Drop leaf image here</p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse (JPG, PNG)</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <Camera className="w-3.5 h-3.5" /> Supports 38+ crop disease classes
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
                </label>
              )}
            </div>

            {previewUrl && !scanning && !result && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleScan}
                className="mt-4 w-full py-4 bg-gradient-to-r from-green-500 to-lime-500 text-white font-bold rounded-2xl text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Scan for Diseases
              </motion.button>
            )}
          </motion.div>

          {/* Results Area */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] space-y-5"
                >
                  {/* Diagnosis Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{result.disease}</h3>
                      <p className="text-gray-400 text-sm">{result.crop} • Detected</p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-green-400 font-bold">{result.confidence}%</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-green-500 to-lime-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Severity:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${severityColor(result.severity)}`}>
                      {result.severity}
                    </span>
                  </div>

                  {/* Treatments */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm font-semibold">Chemical Treatment</span>
                      </div>
                      <p className="text-gray-300 text-sm">{result.chemical}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-semibold">Organic Remedy</span>
                      </div>
                      <p className="text-gray-300 text-sm">{result.organic}</p>
                    </div>
                  </div>

                  {/* Success note */}
                  <div className="flex items-center gap-2 text-green-400/60 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Diagnosis powered by MobileNetV2 CNN
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[320px] rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent border border-dashed border-gray-800 flex items-center justify-center"
                >
                  <div className="text-center p-8">
                    <Leaf className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Upload a leaf image to begin diagnosis</p>
                    <p className="text-gray-700 text-sm mt-2">Results will appear here with treatment options</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
