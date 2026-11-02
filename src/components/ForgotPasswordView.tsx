import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props {
  onBack: () => void
}

export default function ForgotPasswordView({ onBack }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      setMessage('Password reset link sent! Check your email.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">Forgot Password</h1>
      <p className="text-sm text-gray-600 mb-4">Enter your email to receive a reset link</p>
      
      <form onSubmit={handleReset} className="space-y-4">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-gray-600 hover:underline"
        >
          Back to Login
        </button>
      </form>
    </div>
  )
}
