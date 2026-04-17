import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, X, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { extractReportValues, ExtractionResult } from '../lib/extractor'

const UploadPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [examType, setExamType] = useState('')
  const [examDate, setExamDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']

  function handleFileSelect(selected: File) {
    if (!ACCEPTED.includes(selected.type)) {
      setError('Only PDF, JPG, PNG files are accepted')
      return
    }
    setFile(selected)
    setResult(null)
    setError('')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const extraction = await extractReportValues(file)
      setResult(extraction)
      setExamType(extraction.exam_type || '')
      setExamDate(extraction.exam_date || '')
    } catch (err: any) {
      setError(err.message || 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!file || !result) return
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileUrl = 'placeholder'

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: fileUrl,
          exam_type: examType,
          exam_date: examDate || null,
          notes: notes || null,
          raw_extraction: result
        })
        .select()
        .single()
      if (reportError) throw reportError

      const values = result.values.map(v => ({
        user_id: user.id,
        report_id: report.id,
        parameter: v.parameter,
        value: v.value,
        unit: v.unit,
        range_min: v.range_min,
        range_max: v.range_max,
        out_of_range: v.out_of_range,
        exam_date: examDate || null
      }))
      const { error: valuesError } = await supabase
        .from('health_values')
        .insert(values)
      if (valuesError) throw valuesError

      navigate('/reports')
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setExamType('')
    setExamDate('')
    setNotes('')
    setError('')
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Upload Report</h1>

        {loading && (
          <div className="fixed inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
            <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
            <p className="text-gray-600 text-lg">Analyzing report with AI, please wait...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {!result && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors"
            >
              <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Drag your report here or click to select</p>
              <p className="text-gray-400 text-sm mt-1">PDF, JPG, PNG accepted</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <FileText className="w-5 h-5 text-sky-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={handleReset} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Analyze report
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam type</label>
                <input
                  value={examType}
                  onChange={e => setExamType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Parameter</th>
                    <th className="px-4 py-3 text-left">Value</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Range</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.values.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">{v.parameter}</td>
                      <td className="px-4 py-3 text-gray-600">{v.value}</td>
                      <td className="px-4 py-3 text-gray-500">{v.unit}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {v.range_min != null && v.range_max != null ? `${v.range_min} - ${v.range_max}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {v.out_of_range
                          ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Out of range</span>
                          : <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">OK</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="Add any notes about this report..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save report'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default UploadPage
