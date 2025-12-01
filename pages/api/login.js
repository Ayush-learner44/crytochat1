import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db("chatapp");
    const users = db.collection("users");

    if (req.method === "POST") {
        const { username } = req.body;

        if (!username) return res.status(400).json({ message: "Username required" });

        // CHECK IF USER EXISTS
        const user = await users.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not registered. Please sign up first." });
        }

        return res.status(200).json({ message: "User exists", publicKey: user.publicKey });
    }

    res.status(405).json({ message: "Method not allowed" });
}