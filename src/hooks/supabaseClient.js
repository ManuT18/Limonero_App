/*
Copyright (C) 2025 Manuel Tauro

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://gnu.org>.
*/

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
