import similarity from "compute-cosine-similarity";
import { embeddings } from "../shared/connections.js";

const embeddingTest = async () => {
    const documents = [
        "Virat Kohli is an Indian cricketer known for his aggressive batting and leadership.",
        "MS Dhoni is a former Indian captain famous for his calm demeanor and finishing skills.",
        "Sachin Tendulkar, also known as the 'God of Cricket', holds many batting records.",
        "Rohit Sharma is known for his elegant batting and record-breaking double centuries.",
        "Jasprit Bumrah is an Indian fast bowler known for his unorthodox action and yorkers."
    ]
    const query = "Who is sachin"
    const query_embedding = await embeddings.embedQuery(query);
    const documents_embedding = await embeddings.embedDocuments(documents);

    // Calculate similarity between query and each document
    const similarities = documents_embedding.map(doc_embedding =>
        similarity(query_embedding, doc_embedding)
    );

    // Find the most similar document
    const maxSimilarityIndex = similarities.indexOf(Math.max(...similarities));
    console.log(query)
    console.log(documents[maxSimilarityIndex])
    console.log("similarity score is:", similarities[maxSimilarityIndex])
}
export default embeddingTest