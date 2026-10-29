import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hugsadmfvhcuetcmvakz.supabase.co'
const supabaseKey = 'sb_publishable_-Fx-iLMNntSxmkWUFMGjBQ_eZqVXEZi'

export const supabase = createClient(supabaseUrl, supabaseKey)