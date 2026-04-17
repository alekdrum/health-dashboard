import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'

interface Report {
  id: string
  file_name: string
  exam_type: string
  exam_date: string
  notes: string
  created_at: string
}

interface HealthValue {
  id: string
  parameter: string
  value: number
  unit: string
  range_min: number | null
  range_max: number | null
  out_of_range: boolean
}

export const ReportDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [values, setValues] = useState<HealthValue[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      const { data: valuesData } = await supabase
        .from('health_values')
        .select('*')
        .eq('report_id', id)
        .order('parameter')

      if (reportData) setReport(reportData)
      if (valuesData) setValues(valuesData)
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this report?')) return
    setDeleting(true)
    await supabase.from('health_values').delete().eq('report_id', id)
    await supabase.from('reports').delete().eq('id', id)
    navigate('/reports')
  }

  if (loading) return <Layout><div className="p-6 text-gray-400">Loading...</div></Layout>
  if (!report) return <Layout><div className="p-6 text-gray-400">Report not found</div></Layout>

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/reports" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Back to reports
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-xl font-semibold text-gray-800 mb-1">
            {report.exam_type || report.file_name}
          </h1>
          <p className="text-gray-400 text-sm">{report.exam_date || 'No date'} · {report.file_name}</p>
          {report.notes && (
            <p className="mt-3 text-gray-600 text-sm bg-gray-50 rounded-lg p-3">{report.notes}</p>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Parameter</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Range</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {values.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{v.parameter}</td>
                  <td className="px-4 py-3 text-gray-600">{v.value}</td>
                  <td className="px-4 py-3 text-gray-500">{v.unit}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {v.range_min != null && v.range_max != null
                      ? `${v.range_min} - ${v.range_max}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {v.out_of_range
                      ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⚠ Out of range</span>
                      : <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">OK</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}