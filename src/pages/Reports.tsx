import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight, AlertTriangle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'

interface Report {
  id: string
  file_name: string
  exam_type: string
  exam_date: string
  created_at: string
  out_of_range_count?: number
}

export const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('reports')
        .select('id, file_name, exam_type, exam_date, created_at')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false })

      if (data) {
        const reportsWithCounts = await Promise.all(
          data.map(async (report) => {
            const { count } = await supabase
              .from('health_values')
              .select('*', { count: 'exact', head: true })
              .eq('report_id', report.id)
              .eq('out_of_range', true)
            return { ...report, out_of_range_count: count || 0 }
          })
        )
        setReports(reportsWithCounts)
      }
      setLoading(false)
    }
    fetchReports()
  }, [])

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
          <Link
            to="/upload"
            className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
          >
            + New report
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No reports yet. Upload your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <Link
                key={report.id}
                to={`/report/${report.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{report.exam_type || report.file_name}</p>
                  <p className="text-sm text-gray-400">{report.exam_date || 'No date'}</p>
                </div>
                {(report.out_of_range_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {report.out_of_range_count} out of range
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}