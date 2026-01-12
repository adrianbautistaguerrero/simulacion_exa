"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Mail, Shield, Loader2, FileText } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface AnalysisResult {
  prediction: "spam" | "ham" | "error"
  confidence: number
  latency: number
  cleaned_text?: string
  filename?: string
  error?: string
}

interface Statistics {
  total_analyses: number
  spam_count: number
  ham_count: number
  spam_percentage: number
  ham_percentage: number
  avg_confidence: number
  avg_latency: number
  last_24h: {
    total: number
    spam: number
    ham: number
  }
}

export default function SpamDetectorPage() {
  const [message, setMessage] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [inputMode, setInputMode] = useState<"text" | "file">("text")

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileResult, setFileResult] = useState<AnalysisResult | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileTextContent, setFileTextContent] = useState<string | null>(null)

  // Statistics state
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics/`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (err) {
      // Si el API no está disponible, las gráficas mostrarán 0%
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  // Analyze text message
  const analyzeMessage = async () => {
    if (!message.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_text: message }),
      })

      if (!response.ok) {
        throw new Error("Error al analizar el mensaje")
      }

      const data = await response.json()
      setResult(data)

      fetchStatistics()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Analyze uploaded file
  const analyzeFile = async () => {
    if (!selectedFile) return

    setFileLoading(true)
    setFileError(null)
    setFileResult(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(`${API_BASE_URL}/api/analyze-file/`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al analizar el archivo")
      }

      const data = await response.json()
      setFileResult(data)

      fetchStatistics()
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setFileLoading(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileResult(null)
      setFileError(null)
      readFileContent(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileResult(null)
      setFileError(null)
      readFileContent(file)
    }
  }

  const readFileContent = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setFileTextContent(text)
    }
    reader.onerror = () => {
      setFileError("Error al leer el archivo")
      setFileTextContent(null)
    }
    reader.readAsText(file)
  }

  const currentResult = inputMode === "text" ? result : fileResult
  const currentError = inputMode === "text" ? error : fileError
  const currentLoading = inputMode === "text" ? loading : fileLoading

  const spamPercentage = statistics?.spam_percentage ?? 0
  const hamPercentage = statistics?.ham_percentage ?? 0
  const spamCount = statistics?.spam_count ?? 0
  const hamCount = statistics?.ham_count ?? 0
  const totalAnalyses = statistics?.total_analyses ?? 0

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-foreground text-background py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Detector de SPAM con Machine Learning</h1>
          </div>
          <p className="text-lg opacity-90">Regresión Logística + CountVectorizer | Dataset TREC07p</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* SPAM Percentage Chart */}
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-700 dark:text-red-300">SPAM Detectado</h3>
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-red-200 dark:text-red-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - spamPercentage / 100)}`}
                    className="text-red-600 dark:text-red-400"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {spamPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-red-700 dark:text-red-300">
                {spamCount} de {totalAnalyses} emails
              </p>
            </div>
          </Card>

          {/* HAM Percentage Chart */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-700 dark:text-green-300">HAM (Legítimo)</h3>
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-green-200 dark:text-green-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - hamPercentage / 100)}`}
                    className="text-green-600 dark:text-green-400"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {hamPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-300">
                {hamCount} de {totalAnalyses} emails
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Analizar Email</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              {/* Mode Toggle */}
              <div className="mb-4 flex gap-2">
                <Button onClick={() => setInputMode("text")} variant={inputMode === "text" ? "default" : "outline"}>
                  Texto
                </Button>
                <Button onClick={() => setInputMode("file")} variant={inputMode === "file" ? "default" : "outline"}>
                  Archivo
                </Button>
              </div>

              {/* Text Input */}
              {inputMode === "text" && (
                <div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={12}
                    className="w-full border-2 focus:border-foreground"
                    placeholder={`Pega aquí el contenido del email...

Ejemplo:
Subject: Get rich quick!
From: scammer@fake.com

Buy now and win $1000000!!!`}
                  />
                  <Button onClick={analyzeMessage} disabled={loading || !message.trim()} className="w-full mt-4">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      "Analizar Texto"
                    )}
                  </Button>
                </div>
              )}

              {/* File Input */}
              {inputMode === "file" && (
                <div>
                  <div
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-foreground/50 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById("emailFile")?.click()}
                  >
                    <input type="file" id="emailFile" className="hidden" onChange={handleFileChange} />
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">Arrastra o haz clic para subir</p>
                    <p className="text-sm text-muted-foreground mt-2">Archivos inmail.* del dataset TREC</p>
                  </div>

                  {selectedFile && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="font-medium">
                          Archivo seleccionado: <span className="text-muted-foreground">{selectedFile.name}</span>
                        </p>
                      </div>

                      {fileTextContent && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Contenido del archivo:</label>
                          <Textarea
                            value={fileTextContent}
                            readOnly
                            rows={10}
                            className="w-full border-2 bg-background font-mono text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedFile && (
                    <Button onClick={analyzeFile} disabled={fileLoading} className="w-full mt-4">
                      {fileLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        "Analizar Archivo"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Results Section */}
            <div>
              {currentResult ? (
                <div className="space-y-4">
                  {/* Result Card */}
                  <div
                    className={`rounded-lg p-6 border-l-4 ${
                      currentResult.prediction === "spam" ? "bg-red-50 border-red-500" : "bg-green-50 border-green-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{currentResult.prediction === "spam" ? "🚨" : "✅"}</div>
                      <div>
                        <div
                          className={`font-bold text-2xl ${
                            currentResult.prediction === "spam" ? "text-red-700" : "text-green-700"
                          }`}
                        >
                          {currentResult.prediction.toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {currentResult.prediction === "spam" ? "Este email es spam" : "Este email es legítimo"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-bold mb-2">Confianza del Modelo</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress value={currentResult.confidence} className="h-3" />
                      </div>
                      <span className="font-bold text-lg">{currentResult.confidence.toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Latencia</div>
                      <div className="text-2xl font-bold">{currentResult.latency.toFixed(2)} ms</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Algoritmo</div>
                      <div className="text-sm font-semibold mt-1">Regresión Logística</div>
                    </div>
                  </div>

                  {currentResult.filename && (
                    <p className="text-sm text-muted-foreground">Archivo: {currentResult.filename}</p>
                  )}
                </div>
              ) : currentLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" />
                  <p>Analizando email...</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Los resultados aparecerán aquí</p>
                </div>
              )}

              {currentError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{currentError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

