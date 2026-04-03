import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nexgpnxnaljxctqawyys.supabase.co'
const supabaseKey = 'sb_publishable_Ad38Budm40MNcm5gCj2GEg_d38RgI9g'

export const supabase = createClient(supabaseUrl, supabaseKey)
