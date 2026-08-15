// GOES IN: app/admin/setup/countries-test/page.tsx
// TEMPORARY TEST PAGE — delete after we confirm the API key works
'use client'
import { useState } from 'react'

export default function CountriesTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    const res = await fetch('/admin/setup/countries-test/api')
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">Countries API — Connection Test</h1>
      <button
        onClick={runTest}
        disabled={loading}
        className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
      >
        {loading ? 'Testing…' : 'Run Test'}
      </button>

      {result && (
        <pre className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
