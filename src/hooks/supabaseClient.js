/*
  -------------------------------------------------------------------------
  1. IMPORTACIONES
  Importa la función 'createClient' de la librería oficial de Supabase.
  Esta función permite establecer la conexión con el proyecto en la nube.
  -------------------------------------------------------------------------
*/
import { createClient } from "@supabase/supabase-js";

/*
  -------------------------------------------------------------------------
  2. VARIABLES DE ENTORNO
  Recupera las credenciales sensibles desde las variables de entorno (.env).
  VITE requiere que las variables empiecen con "VITE_" para ser accesibles en el frontend.
  
  - SUPABASE_URL: La dirección web del proyecto (API Gateway).
  - SUPABASE_ANON_KEY: La clave pública que permite hacer peticiones. 
    (Es seguro tenerla en el frontend porque las reglas de seguridad RLS protegen los datos).
  -------------------------------------------------------------------------
*/
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
  -------------------------------------------------------------------------
  3. INICIALIZACIÓN DEL CLIENTE
  Crea y exporta una única instancia del cliente para usarla en toda la app.
  Este objeto 'supabase' expone métodos como .auth.signIn(), .from('tabla').select(), etc.
  -------------------------------------------------------------------------
*/
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
