// src/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fpfhlrgmxkswobvvpiwz.supabase.co';  // Copia la URL de tu proyecto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmhscmdteGtzd29idnZwaXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzA2MzkyMywiZXhwIjoyMDYyNjM5OTIzfQ.umX4PpVTZIlgkukvUnY-vVSyxR0tpP02PIZet6QZAVI';  // Copia la clave API de tu proyecto

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;