"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Mail, Shield, Loader2, BarChart3, FileText, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface AnalysisResult {
  prediction: "spam" | "ham" | "error"
  confidence: number
  latency: number
  cleaned_text?: string
  filename?: string
  error?: string
  spam_keywords?: string[]
  ham_probability?: number
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${data.detail || "Error al analizar el mensaje"}`)
      }

      setResult(data)
    } catch (err) {
      console.error("Error analyzing message:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al conectar con el servidor")
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${data.detail || "Error al analizar el archivo"}`)
      }

      setFileResult(data)
    } catch (err) {
      console.error("Error analyzing file:", err)
      setFileError(err instanceof Error ? err.message : "Error desconocido al conectar con el servidor")
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

  const spamProbability = currentResult
    ? currentResult.prediction === "spam"
      ? currentResult.confidence
      : 100 - currentResult.confidence
    : 0

  const hamProbability = currentResult
    ? currentResult.prediction === "ham"
      ? currentResult.confidence
      : 100 - currentResult.confidence
    : 0

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

              {/* Error Display */}
              {currentError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700">Error</p>
                    <p className="text-sm text-red-600">{currentError}</p>
                  </div>
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

                  {/* Probability Chart */}
                  <div className="bg-muted rounded-lg p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Gráfico de Probabilidad
                    </h3>
                    <div className="space-y-4">
                      {/* SPAM Probability */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-red-700">SPAM</span>
                          <span className="text-sm font-bold text-red-700">{spamProbability.toFixed(2)}%</span>
                        </div>
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-red-500 transition-all duration-500 ease-out flex items-center justify-end pr-2"
                            style={{ width: `${spamProbability}%` }}
                          >
                            {spamProbability > 10 && (
                              <span className="text-xs font-bold text-white">{spamProbability.toFixed(0)}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* HAM Probability */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-green-700">HAM (Legítimo)</span>
                          <span className="text-sm font-bold text-green-700">{hamProbability.toFixed(2)}%</span>
                        </div>
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-green-500 transition-all duration-500 ease-out flex items-center justify-end pr-2"
                            style={{ width: `${hamProbability}%` }}
                          >
                            {hamProbability > 10 && (
                              <span className="text-xs font-bold text-white">{hamProbability.toFixed(0)}%</span>
                            )}
                          </div>
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

                  {/* Spam Keywords List */}
                  {currentResult.spam_keywords && currentResult.spam_keywords.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Palabras que Indican SPAM
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Estas palabras contribuyeron a la clasificación de spam:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentResult.spam_keywords.map((keyword, index) => (
                          <Badge key={index} variant="destructive" className="text-sm">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Latencia</div>
                      <div className="text-2xl font-bold">{currentResult.latency.toFixed(2)} ms</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Algoritmo</div>
                      <div className="text-sm font-bold">Regresión Logística</div>
                    </div>
                  </div>

                  {currentResult.filename && (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Archivo:</div>
                      <div className="text-sm font-medium break-all">{currentResult.filename}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8 bg-muted/50 rounded-lg border-2 border-dashed">
                  <div>
                    <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">Sin resultados aún</p>
                    <p className="text-sm text-muted-foreground mt-2">Pega un email o sube un archivo para analizar</p>
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

