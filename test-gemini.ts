import { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";

type Reference = { _id: string; title: string; url?: string | null };
interface Expert {
    _id?: ObjectId | string;
    references?: Reference[];
    name: string;
}

async function test() {
    const db = new MongoClient("mongodb://localhost").db("test");
    const expertId = "5f9b3b3b3b3b3b3b3b3b3b3b";
    const referenceId = "ref123";
    
    await db.collection<Expert>("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $pull: { references: { _id: referenceId } } }
    );
}
