/*
Copyright (C) 2025 Manuel Tauro

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

/*
  -------------------------------------------------------------------------
  COMPONENTE: DeleteAccount
  Permite al usuario eliminar todos sus datos y su cuenta.
  Requiere re-autenticación (Email + Password) por seguridad.
  -------------------------------------------------------------------------
*/
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Trash2, AlertTriangle, Loader2, Lock, X } from "lucide-react";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function DeleteAccount() {
  const { user, signOut, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleConfirmDelete = async (e) => {
    e.preventDefault();

    // 1. Validar que el email coincida con el usuario actual
    if (confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      toast.error("El email ingresado no coincide con tu cuenta.");
      return;
    }

    setLoading(true);

    try {
      // 2. Re-autenticar para verificar la contraseña
      const { error: authError } = await signIn({
        email: confirmEmail,
        password: confirmPassword,
      });

      if (authError) {
        throw new Error(
          "Contraseña incorrecta. No se pudo verificar tu identidad.",
        );
      }

      // 3. Pre-cleanup: Borrar datos dependientes
      // IMPORTANTE: Checking de errores para evitar fallos silenciosos

      // A. Limpiar Storage (Imágenes de productos)
      const { data: userFiles } = await supabase.storage
        .from("product-images")
        .list(user.id + "/"); // Listar archivos en la carpeta del usuario

      if (userFiles && userFiles.length > 0) {
        const filesToRemove = userFiles.map((x) => `${user.id}/${x.name}`);
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove(filesToRemove);

        if (storageError)
          console.error("Error limpiando storage:", storageError);
      }

      // B. Limpiar Tablas (Software Cascade)
      // Función helper para borrar y throw error si falla
      const deleteTable = async (table) => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", user.id);
        if (error)
          throw new Error(`Error al limpiar ${table}: ${error.message}`);
      };

      await deleteTable("products");
      await deleteTable("inventory");
      await deleteTable("cashbook");
      await deleteTable("presets");
      await deleteTable("user_config");

      // 4. Si credenciales son válidas y limpieza exitosa, ejecutar el borrado (RPC)
      const { error: rpcError } = await supabase.rpc("delete_user");
      if (rpcError) throw rpcError;

      toast.success("Cuenta verificada y eliminada correctamente.");
      setShowConfirmModal(false);

      // 4. Cerrar sesión completamente
      setTimeout(async () => {
        await signOut();
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="card"
        style={{
          marginTop: "2rem",
          borderColor: "#FCA5A5",
          background: "rgba(239, 68, 68, 0.02)",
        }}
      >
        <div
          className="section-title"
          style={{ color: "#EF4444", marginBottom: "1rem" }}
        >
          <Trash2 size={24} /> Eliminar Cuenta
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          Para eliminar tu cuenta permanentemente, necesitamos verificar tu
          identidad. Esta acción borrará todos tus datos y no se puede deshacer.
        </p>

        <button
          className="btn"
          onClick={() => setShowConfirmModal(true)}
          style={{
            background: "#EF4444",
            color: "white",
            border: "none",
            fontWeight: "bold",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Trash2 size={18} /> Iniciar proceso de eliminación
        </button>
      </div>

      {/* Modal de Confirmación de Seguridad */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "400px",
              width: "100%",
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#EF4444",
                }}
              >
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Verificación Requerida
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
              }}
            >
              Por favor ingresa tus credenciales actuales para confirmar la
              eliminación definitiva.
            </p>

            <form
              onSubmit={handleConfirmDelete}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label className="label">Tu Email Actual</label>
                <input
                  type="email"
                  className="input"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user.email}
                  required
                />
              </div>

              <div>
                <label className="label">Contraseña</label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-secondary)",
                    }}
                  />
                  <input
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: "2.25rem" }}
                    required
                  />
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    background: "#EF4444",
                    color: "white",
                    border: "none",
                  }}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Eliminar Cuenta"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
