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
  SERVICIO DE TRANSACCIONES
  Lógica de negocio desacoplada de la UI.
  Maneja operaciones complejas que involucran múltiples tablas (Inventory + Cashbook).
  -------------------------------------------------------------------------
*/
import { supabase } from "../hooks/supabaseClient";

/**
 * Registra una impresión como venta:
 * 1. Descuenta stock del inventario.
 * 2. Agrega registro al libro de caja (Cashbook).
 *
 * @param {Object} params
 * @param {string} params.userId - ID del usuario actual.
 * @param {string} params.materialId - ID del material (inventario).
 * @param {number} params.quantity - Cantidad en gramos a descontar.
 * @param {number} params.price - Precio final de venta.
 * @param {string} params.clientName - Nombre del cliente (opcional).
 * @param {string} params.description - Descripción de la venta.
 * @param {Object} params.materialDetails - Datos del material para descripción ({tipo, color}).
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const registerPrintTransaction = async ({
  userId,
  materialId,
  quantity,
  price,
  clientName,
  description,
  materialDetails,
}) => {
  try {
    // 1. Obtener stock actual (verificación extra de seguridad)
    const { data: material, error: fetchError } = await supabase
      .from("inventory")
      .select("stock")
      .eq("id", materialId)
      .single();

    if (fetchError || !material)
      throw new Error("Material no encontrado o error de conexión.");

    // 2. Calcular y actualizar nuevo stock
    const newStock = (material.stock || 0) - quantity;
    const { error: stockError } = await supabase
      .from("inventory")
      .update({ stock: newStock })
      .eq("id", materialId);

    if (stockError)
      throw new Error("Error al actualizar stock: " + stockError.message);

    // 3. Crear descripción automática si no existe
    const autoDesc = description
      ? `${description} - ${quantity}g ${materialDetails.tipo} ${materialDetails.color}`
      : `Impresión: ${quantity}g de ${materialDetails.tipo} ${materialDetails.color}`;

    // 4. Registrar en Cashbook
    const payload = {
      user_id: userId,
      fecha: new Date().toISOString(),
      tipo: "INGRESO", // Siempre es ingreso porque es una venta/servicio
      monto: price,
      descripcion: autoDesc,
      nombre: clientName || "",
      metadata: {
        stockRestoration: {
          materialId,
          quantity,
        },
      },
    };

    const { error: cashError } = await supabase
      .from("cashbook")
      .insert([payload]);

    if (cashError)
      throw new Error("Error al registrar en caja: " + cashError.message);

    return { success: true, newStock };
  } catch (error) {
    return { success: false, error };
  }
};
