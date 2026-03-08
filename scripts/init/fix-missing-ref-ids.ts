// scripts/fix-missing-ref-ids.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { Expert } from "@/lib/types";

async function fixMissingReferenceIds() {
  console.log("Iniciando script de migración para corregir IDs de referencias faltantes...");

  try {
    const { db } = await connectToDatabase();
    const expertsCollection = db.collection<Expert>("experts");

    // Encontrar todos los expertos que tienen al menos una referencia donde _id no existe.
    const expertsWithMissingIds = await expertsCollection.find({
      "references._id": { $exists: false }
    }).toArray();

    if (expertsWithMissingIds.length === 0) {
      console.log("¡Excelente! No se encontraron referencias con IDs faltantes. La base de datos está limpia.");
      return;
    }

    console.log(`Se encontraron ${expertsWithMissingIds.length} expertos con referencias que necesitan ser corregidas.`);

    let updatedCount = 0;

    for (const expert of expertsWithMissingIds) {
      let referencesModified = false;
      const updatedReferences = expert.references?.map(ref => {
        // Si la referencia ya tiene un _id, la dejamos como está.
        if (ref._id) {
          return ref;
        }
        
        // Si no tiene _id, le asignamos uno nuevo.
        referencesModified = true;
        console.log(`- Corrigiendo referencia "${ref.title}" para el experto ${expert.name}`);
        return {
          ...ref,
          _id: new ObjectId().toString(),
        };
      }) || [];

      if (referencesModified) {
        // Actualizar el documento del experto con el array de referencias corregido.
        await expertsCollection.updateOne(
          { _id: expert._id },
          { $set: { references: updatedReferences } }
        );
        updatedCount++;
      }
    }

    console.log(`
Proceso completado. Se actualizaron ${updatedCount} expertos.`);
    console.log("Todos las obras ahora tienen un ID único y permanente.");

  } catch (error) {
    console.error("\nOcurrió un error durante el script de migración:", error);
    process.exit(1);
  }
}

fixMissingReferenceIds().then(() => {
  console.log("Script finalizado.");
  // MongoDB connection might keep the script alive, force exit if needed.
  process.exit(0);
});
