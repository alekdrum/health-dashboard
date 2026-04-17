import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Stats {
  totalReports: number
  outOfRangeCount: number
  lastReportDate: string | null
  pendingReminders: number
}

interface OutOfRangeValue {
  parameter: string
  value: number
  unit: string
  range_min: number | null
  range_max: number | null
  exam_date: string
  report_id: string
  exam_type: string
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    outOfRangeCount: 0,
    lastReportDate: null,
    pendingReminders: 0
  })
  const [outOfRangeValues, setOutOfRangeValues] = useState<OutOfRangeValue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      const [reportsRes, outOfRangeRes, remindersRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, exam_date')
          .eq('user_id', user.id)
          .order('exam_date', { ascending: false }),
        supabase
          .from('health_values')
          .select('parameter, value, unit, range_min, range_max, exam_date, report_id, reports(exam_type)')
          .eq('user_id', user.id)
          .eq('out_of_range', true)
          .order('exam_date', { ascending: false })
          .limit(10),
        supabase
          .from('reminders')
          .select('id')
          .eq('user_id', user.id)
          .eq('done', false)
          .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ])

      const reports = reportsRes.data || []
      const outOfRange = outOfRangeRes.data || []
      const reminders = remindersRes.data || []

      setStats({
        totalReports: reports.length,
        outOfRangeCount: outOfRange.length,
        lastReportDate: reports[0]?.exam_date || null,
        pendingReminders: reminders.length
      })

      setOutOfRangeValues(outOfRange.map((v: any) => ({
        ...v,
        exam_type: v.reports?.exam_type || 'Unknown'
      })))

      setLoading(false)
    }
    fetchData()
  }, [user])

  const statCards = [
    { label: 'Total reports', value: stats.totalReports, icon: FileText, color: 'text-sky-500', bg: 'bg-sky-50' },
    { label: 'Out of range values', value: stats.outOfRangeCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Last report', value: stats.lastReportDate || 'None', icon: Calendar, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Reminders due', value: stats.pendingReminders, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-gray-400 text-sm mb-8">Here's your health overview</p>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Out of range values */}
            {outOfRangeValues.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Values out of range
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="pb-3 text-left">Parameter</th>
                        <th className="pb-3 text-left">Value</th>
                        <th className="pb-3 text-left">Range</th>
                        <th className="pb-3 text-left">Date</th>
                        <th className="pb-3 text-left">Exam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {outOfRangeValues.map((v, i) => (
                        <tr key={i}>
                          <td className="py-2.5 font-medium text-gray-700">{v.parameter}</td>
                          <td className="py-2.5 text-red-600 font-medium">{v.value} {v.unit}</td>
                          <td className="py-2.5 text-gray-400">
                            {v.range_min != null && v.range_max != null ? `${v.range_min} - ${v.range_max}` : '-'}
                          </td>
                          <td className="py-2.5 text-gray-400">{v.exam_date}</td>
                          <td className="py-2.5">
                            <Link to={`/report/${v.report_id}`} className="text-sky-500 hover:underline text-xs">
                              {v.exam_type}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/upload"
                className="bg-sky-500 text-white rounded-xl p-5 hover:bg-sky-600 transition-colors"
              >
                <FileText className="w-6 h-6 mb-2" />
                <p className="font-medium">Upload new report</p>
                <p className="text-sky-100 text-xs mt-1">Add a lab report or document</p>
              </Link>
              <Link
                to="/trends"
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-sky-300 transition-colors"
              >
                <TrendingUp className="w-6 h-6 mb-2 text-sky-500" />
                <p className="font-medium text-gray-700">View trends</p>
                <p className="text-gray-400 text-xs mt-1">Track your values over time</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}