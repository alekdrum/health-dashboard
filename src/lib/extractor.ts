import { supabase } from './supabase'

export interface ExtractionResult {
  exam_date: string | null
  exam_type: string
  values: Array<{
    parameter: string
    value: number
    unit: string
    range_min: number | null
    range_max: number | null
    out_of_range: boolean
  }>
}

export async function extractReportValues(file: File): Promise<ExtractionResult> {
  const base64 = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('extract-report', {
    body: { fileBase64: base64, mimeType: file.type }
  })
  if (error) throw new Error(error.message)
  return data as ExtractionResult
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
