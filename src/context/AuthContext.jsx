/*
Copyright (C) 2025 Manuel Tauro

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../hooks/supabaseClient";

/*
  -------------------------------------------------------------------------
  CREACIÓN DEL CONTEXTO
  Crea el contexto 'AuthContext' que servirá para pasar el estado global
  del usuario (sesión, datos del usuario, funciones de login) a toda la aplicación.
  -------------------------------------------------------------------------
*/
const AuthContext = createContext();

/*
  -------------------------------------------------------------------------
  COMPONENTE PROVIDER (AuthProvider)
  Este componente envuelve a toda la aplicación (en App.jsx) y gestiona el ciclo
  de vida de la autenticación. Es el "cerebro" que sabe si estás logueado o no.
  -------------------------------------------------------------------------
*/
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
    -------------------------------------------------------------------------
    GESTIÓN DE LA SESIÓN
    Este useEffect se ejecuta una sola vez al cargar la aplicación.
    
    A) Verificación Inicial:
      Consulta a Supabase si existe una sesión activa persistida (localStorage/cookie).
      Si existe, actualiza el estado inmediatamente.

    B) Escucha en Tiempo Real (Listener):
      Se suscribe a los cambios de estado (LOGIN, SIGNOUT, TOKEN_REFRESH) mediante
      'onAuthStateChange'. Esto asegura que si el usuario se desloguea en otra
      pestaña o expira el token, la aplicación reaccione y redirija al login.
  -------------------------------------------------------------------------
  */
  useEffect(() => {
    // Función auxiliar para obtener datos extra del perfil (is_approved)
    const fetchProfile = async (sessionData) => {
      if (!sessionData?.user) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_approved")
          .eq("id", sessionData.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        }

        // Combinamos el usuario de Auth con el flag is_approved de la DB
        const enrichedUser = {
          ...sessionData.user,
          is_approved: data?.is_approved ?? false, // Por seguridad default false
        };

        setSession(sessionData);
        setUser(enrichedUser);
      } catch (err) {
        console.error("Unexpected error in fetchProfile:", err);
      } finally {
        setLoading(false);
      }
    };

    // A) Verificación Inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session);
    });

    // B) Listener de cambios
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /*
    -------------------------------------------------------------------------
    VALORES Y FUNCIONES EXPUESTAS
    Prepara el objeto 'value' con todo lo que queremos que los demás componentes
    puedan usar. Incluye funciones directas para Login, Registro y Logout, además
    de los datos del usuario actual.
    -------------------------------------------------------------------------
  */
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    session,
    loading,
  };

  /*
    -------------------------------------------------------------------------
    RENDERIZADO CONDICIONAL
    Solo renderiza los hijos (children) cuando 'loading' es false. Esto evita
    que la aplicación intente cargar componentes privados antes de saber si hay
    un usuario autenticado, previniendo parpadeos o redirecciones erróneas.
    -------------------------------------------------------------------------
  */
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

/*
  -------------------------------------------------------------------------
  CUSTOM HOOK (useAuth)
  Hook personalizado para facilitar el consumo del contexto. En lugar de importar
  useContext y AuthContext en cada archivo, los componentes solo importan 'useAuth'.
  -------------------------------------------------------------------------
*/
export function useAuth() {
  return useContext(AuthContext);
}
