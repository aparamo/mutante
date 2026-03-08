import { addReferenceAction } from "../../lib/actions/expert-actions";
import { downloadAndParsePdfAction } from "../../lib/actions/pdf-actions";
import { connectToDatabase } from "../../lib/db/mongodb";
import { mock } from "bun:test";

mock.module("./auth", () => ({
  auth: () => Promise.resolve({ user: { name: "Test User" } })
}));

mock.module("next/cache", () => ({
  revalidatePath: () => {}
}));

async function main() {
    const { db } = await connectToDatabase();
    const expert = await db.collection("experts").findOne({});
    if (!expert) return;

    const publication = {
        title: "Test Publication",
        description: "Test description",
        year: "2018",
        url: "https://biblioteca.semarnat.gob.mx/janium/Documentos/Ciga/libros2018/CD006515.pdf"
    };

    console.log("Calling addReferenceAction...");
    const addResult = await addReferenceAction(expert._id.toString(), publication);
    console.log("Add Result:", addResult);

    if (addResult.success && addResult.data) {
        console.log("Calling downloadAndParsePdfAction...");
        try {
            const processResult = await downloadAndParsePdfAction(expert._id.toString(), (addResult.data as any)._id);
            console.log("Process Result:", processResult);
        } catch (e) {
            console.error("Process Error:", e);
        }
    }
    
    process.exit(0);
}
main();