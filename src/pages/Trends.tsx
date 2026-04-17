import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

interface HealthValue {
  exam_date: string
  value: number
  unit: string
  range_min: number | null
  range_max: number | null
  out_of_range: boolean
}

export const TrendsPage = () => {
  const { user } = useAuth()
  const [parameters, setParameters] = useState<string[]>([])
  const [selected, setSelected] = useState<string>('')
  const [values, setValues] = useState<HealthValue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchParameters() {
      if (!user) return
      const { data } = await supabase
        .from('health_values')
        .select('parameter')
        .eq('user_id', user.id)
      if (data) {
        const unique = [...new Set(data.map(d => d.parameter))].sort()
        setParameters(unique)
        if (unique.length > 0) setSelected(unique[0])
      }
      setLoading(false)
    }
    fetchParameters()
  }, [user])

  useEffect(() => {
    async function fetchValues() {
      if (!user || !selected) return
      const { data } = await supabase
        .from('health_values')
        .select('exam_date, value, unit, range_min, range_max, out_of_range')
        .eq('user_id', user.id)
        .eq('parameter', selected)
        .order('exam_date', { ascending: true })
      if (data) setValues(data)
    }
    fetchValues()
  }, [user, selected])

  const rangeMin = values[0]?.range_min
  const rangeMax = values[0]?.range_max
  const unit = values[0]?.unit

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Trends</h1>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : parameters.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No data yet. Upload a report first!</div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Parameter</label>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 w-full max-w-sm"
              >
                {parameters.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {values.length > 0 && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-sm font-medium text-gray-500 mb-4">
                    {selected} {unit ? `(${unit})` : ''}
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={values} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="exam_date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: any) => [`${value} ${unit || ''}`, selected]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      {rangeMin != null && (
                        <ReferenceLine y={rangeMin} stroke="#22c55e" strokeDasharray="4 4" label={{ value: `min ${rangeMin}`, fontSize: 11, fill: '#22c55e' }} />
                      )}
                      {rangeMax != null && (
                        <ReferenceLine y={rangeMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `max ${rangeMax}`, fontSize: 11, fill: '#ef4444' }} />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props
                          return (
                            <circle
                              key={`dot-${payload.exam_date}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={payload.out_of_range ? '#ef4444' : '#0ea5e9'}
                              stroke="white"
                              strokeWidth={2}
                            />
                          )
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Value</th>
                        <th className="px-4 py-3 text-left">Range</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...values].reverse().map((v, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{v.exam_date}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">{v.value} {v.unit}</td>
                          <td className="px-4 py-3 text-gray-400">
                            {v.range_min != null && v.range_max != null ? `${v.range_min} - ${v.range_max}` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {v.out_of_range
                              ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">⚠ Out of range</span>
                              : <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">OK</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}