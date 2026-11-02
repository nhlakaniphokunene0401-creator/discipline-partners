import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ELibraryView(){
  const [files,setFiles]=useState<any[]>([])
  const [loading,setLoading]=useState(false)
  useEffect(()=>{ fetchFiles() },[])
  const fetchFiles=async()=>{
    const {data}=await supabase.from('school_resources').select('*').order('created_at',{ascending:false})
    setFiles(data||[])
  }
  const upload=async(e:any)=>{
    const file=e.target.files[0]; if(!file) return;
    setLoading(true)
    const {error}=await supabase.storage.from('resources').upload(`school/${Date.now()}-${file.name}`,file)
    if(error){ alert(error.message); setLoading(false); return; }
    const {data}=supabase.storage.from('resources').getPublicUrl(`school/${Date.now()}-${file.name}`)
    // Note: getPublicUrl needs exact same path - so we re-upload logic simplified
    // Simpler: use file.name path
    alert('Uploading... check Supabase Storage')
    setLoading(false); fetchFiles()
  }
  const handleUpload=async(e:any)=>{
    const file=e.target.files[0]; if(!file) return;
    const path=`${Date.now()}-${file.name}`
    const {error}=await supabase.storage.from('resources').upload(path,file)
    if(error) return alert(error.message)
    const {data}=supabase.storage.from('resources').getPublicUrl(path)
    await supabase.from('school_resources').insert({file_name:file.name,file_url:data.publicUrl,file_type:file.type})
    alert('Done!'); fetchFiles()
  }
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">📚 School Resources - Offline Mode</h1>
      <p className="text-sm text-gray-600">Upload ANY file: PDF, Word, Video, ZIP. Learners can View/Download and it saves offline.</p>
      <input type="file" onChange={handleUpload} className="mt-4 border p-2" />
      {loading && <p>Uploading...</p>}
      <div className="mt-6 grid gap-2">
        {files.map(f=>(
          <div key={f.id} className="border p-3 flex justify-between items-center">
            <span>{f.file_name} ({f.file_type})</span>
            <a href={f.file_url} target="_blank" className="bg-blue-600 text-white px-4 py-1 rounded">View / Download</a>
          </div>
        ))}
      </div>
    </div>
  )
}
