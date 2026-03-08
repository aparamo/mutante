import { connectToDatabase } from "../../lib/db/mongodb";
import { ObjectId } from "mongodb";

async function main() {
    const { db } = await connectToDatabase();
    const expert = await db.collection("experts").findOne({});
    if (!expert) return;

    const expertId = expert._id.toString();
    const referenceId = new ObjectId().toString();

    // 1. Simulate addReferenceAction
    const newReference = {
        _id: referenceId,
        title: "Test Publication",
        type: "article",
        url: "https://biblioteca.semarnat.gob.mx/janium/Documentos/Ciga/libros2018/CD006515.pdf"
    };

    console.log("Adding reference with ID:", referenceId);
    await db.collection("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $push: { references: newReference } as any }
    );

    // 2. Simulate downloadAndParsePdfAction read
    const expertFound = await db.collection("experts").findOne({ 
        _id: new ObjectId(expertId),
        "references._id": referenceId
    }, {
        projection: {
            name: 1,
            "references.$": 1
        }
    });

    console.log("Expert found:", !!expertFound);
    console.log("Reference found:", expertFound?.references?.[0]?._id);

    process.exit(0);
}
main();