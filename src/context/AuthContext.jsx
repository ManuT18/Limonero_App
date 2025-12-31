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
    // A) Verificación Inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // B) Listener de cambios
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
