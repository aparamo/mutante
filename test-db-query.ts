import { connectToDatabase } from "./lib/db/mongodb";
import { ObjectId } from "mongodb";

async function main() {
    const { db } = await connectToDatabase();
    const expert = await db.collection("experts").findOne({ "references.0": { $exists: true } });
    console.log("Random expert:", expert?._id, "References:", expert?.references?.length);
    
    if (expert && expert.references && expert.references.length > 0) {
        const ref = expert.references[0];
        console.log("First ref id:", ref._id, "type:", typeof ref._id);
        
        const foundStr = await db.collection("experts").findOne({
            _id: expert._id,
            "references._id": ref._id
        }, {
            projection: { "references.$": 1 }
        });
        console.log("Found with string:", foundStr?.references?.[0]?._id);

        try {
            const foundObj = await db.collection("experts").findOne({
                _id: expert._id,
                "references._id": new ObjectId(ref._id)
            }, {
                projection: { "references.$": 1 }
            });
            console.log("Found with ObjectId:", foundObj?.references?.[0]?._id);
        } catch (e) {
            console.log("Found with ObjectId: Error", (e as Error).message);
        }
    }
    process.exit(0);
}
main();