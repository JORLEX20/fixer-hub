import { createClient } from '@supabase/supabase-js'

// Pega aquí el Project URL que sacaste de "Data API"
const supabaseUrl = 'https://wolzqucfizbulodxwmtc.supabase.co' 

// Pega aquí la "Publishable key" que sacaste de la pantalla de tu captura
const supabaseAnonKey = 'sb_publishable_v4vPRdE1bgTXd58qbMl8PA_sKldKOZI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)