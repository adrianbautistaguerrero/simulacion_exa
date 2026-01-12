"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Mail, Shield, Loader2, FileText } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface AnalysisResult {
  prediction: "spam" | "ham" | "error"
  confidence: number
  latency: number
  cleaned_text?: string
  filename?: string
  error?: string
}

interface LocalStats {
  spamCount: number
  hamCount: number
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

  // Local state for spam and ham counters
  const [localStats, setLocalStats] = useState<LocalStats>({ spamCount: 0, hamCount: 0 })

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

      // Update local counters based on the result
      if (data.prediction === "spam") {
        setLocalStats((prev) => ({ ...prev, spamCount: prev.spamCount + 1 }))
      } else if (data.prediction === "ham") {
        setLocalStats((prev) => ({ ...prev, hamCount: prev.hamCount + 1 }))
      }
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

      // Update local counters based on the result
      if (data.prediction === "spam") {
        setLocalStats((prev) => ({ ...prev, spamCount: prev.spamCount + 1 }))
      } else if (data.prediction === "ham") {
        setLocalStats((prev) => ({ ...prev, hamCount: prev.hamCount + 1 }))
      }
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

  // Calculate percentages using local counters
  const { spamCount, hamCount } = localStats
  const totalAnalyses = spamCount + hamCount
  const spamPercentage = totalAnalyses > 0 ? (spamCount / totalAnalyses) * 100 : 0
  const hamPercentage = totalAnalyses > 0 ? (hamCount / totalAnalyses) * 100 : 0

  // Data for the pie chart
  const chartData = [
    { name: "SPAM", value: spamCount, percentage: spamPercentage, fill: "#dc2626" },
    { name: "HAM", value: hamCount, percentage: hamPercentage, fill: "#16a34a" },
  ]

  const chartConfig = {
    spam: {
      label: "SPAM",
      color: "#dc2626",
    },
    ham: {
      label: "HAM (Legítimo)",
      color: "#16a34a",
    },
  }

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
        {/* Improved chart section */}
        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <h2 className="text-2xl font-bold mb-6 text-center">Distribución de Análisis</h2>

          {totalAnalyses === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Aún no hay análisis realizados</p>
              <p className="text-sm mt-2">Las gráficas aparecerán después de analizar emails</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Improved pie chart */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-4">Distribución por Tipo</h3>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-bold" style={{ color: data.fill }}>
                                  {data.name}
                                </p>
                                <p className="text-sm">Cantidad: {data.value}</p>
                                <p className="text-sm">Porcentaje: {data.percentage.toFixed(1)}%</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Improved statistics cards */}
              <div className="flex flex-col justify-center space-y-4">
                <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 border-2 border-red-300 dark:border-red-700 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-300">SPAM Detectado</h3>
                    <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-red-700 dark:text-red-300">
                      {spamPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                    {spamCount} email{spamCount !== 1 ? "s" : ""} de {totalAnalyses} total
                  </p>
                  <Progress value={spamPercentage} className="h-3 bg-red-200 dark:bg-red-900/50" />
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/40 border-2 border-green-300 dark:border-green-700 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-green-700 dark:text-green-300">HAM (Legítimo)</h3>
                    <Mail className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-green-700 dark:text-green-300">
                      {hamPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                    {hamCount} email{hamCount !== 1 ? "s" : ""} de {totalAnalyses} total
                  </p>
                  <Progress value={hamPercentage} className="h-3 bg-green-200 dark:bg-green-900/50" />
                </Card>

                <div className="text-center p-5 bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 shadow-md">
                  <p className="text-sm text-muted-foreground font-medium">Total de Análisis</p>
                  <p className="text-4xl font-bold mt-1">{totalAnalyses}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Analizar Email</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mode Toggle */}
            <div>
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
