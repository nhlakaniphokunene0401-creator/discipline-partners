import { useState } from 'react'
import { isValidSAID, isStrongPassword } from '../lib/validators'
import { supabase } from '../lib/supabaseClient'

export default function ForgotPasswordView({ onBack }: any){
  const [saId,setSaId]=useState(''); const [email,setEmail]=useState(''); const [pass,setPass]=useState('');
  const submit=async()=>{
    if(!isValidSAID(saId)) return alert('Invalid SA ID - check 13 digits, date of birth')
    if(!isStrongPassword(pass)) return alert('Password must be 8+ chars with a number')
    const {error}=await supabase.auth.updateUser({password:pass})
    if(error) alert(error.message); else { alert('Password reset!'); onBack() }
  }
  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Reset Password - Private System</h2>
      <div className="border rounded p-4 mb-3"><label className="text-sm">1. SA ID Number</label><input value={saId} onChange={e=>setSaId(e.target.value)} placeholder="13 digit SA ID" className="w-full border p-2 mt-1"/></div>
      <div className="border rounded p-4 mb-3"><label className="text-sm">2. Registered Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="w-full border p-2 mt-1"/></div>
      <div className="border rounded p-4 mb-4"><label className="text-sm">3. New Password (8+ chars + number)</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="New password" className="w-full border p-2 mt-1"/></div>
      <button onClick={submit} className="bg-blue-600 text-white w-full py-2 rounded">Reset Password</button>
      <button onClick={onBack} className="mt-2 w-full">Back to Login</button>
    </div>
  )
}
