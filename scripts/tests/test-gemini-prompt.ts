
import { searchModel } from "../../lib/ai/gemini";
import { config } from "dotenv";

config();

async function testPrompt() {
    console.log("Testing extended prompt...");
    const prompt = `Investiga a fondo a esta persona:
Nombre: BOEGE SCHMIDT Eckart
Sector: Academia
Contexto: Fue parte del Programa LEAD-México del Colegio de México en la Cohorte 1. Es un experto/a en Desarrollo Sustentable, Medio Ambiente o áreas afines en México o Latinoamérica.

Queremos construir un Sistema Experto de Conocimiento. Tu tarea es extraer la mayor cantidad y mejor calidad de información sobre su trabajo, análisis y resultados.
1. Realiza una búsqueda exhaustiva en internet (Google Scholar, repositorios académicos, entrevistas, artículos, YouTube, sitios web institucionales).
2. Biografía profesional detallada (énfasis en sus aportaciones teóricas y prácticas).
3. Obras Cumbre / Trabajos Representativos: Identifica y enlista sus 3 a 5 publicaciones, libros o proyectos MÁS IMPORTANTES. Explica brevemente por qué son importantes y cuáles fueron sus hallazgos o tesis principales.
4. Citas, Lecciones y Hallazgos (Citations): Extrae al menos 5 a 10 citas textuales profundas, datos fundamentales o lecciones clave que haya aportado a su campo. Entre más sustanciales y detalladas, mejor.
5. Lista extensa de publicaciones y enlaces a su trabajo.

Devuelve la información estructurada estrictamente en un bloque de código JSON (empezando con \`\`\`json y terminando con \`\`\`).
Asegúrate de que las propiedades "bio", "topics", "links", "references" y "citations" existan.
Dentro de "references", añade un campo "description" opcional para explicar los hallazgos de las obras cumbre.
`;

    try {
        const result = await searchModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.2,
            }
        });
        const text = result.response.text();
        console.log(text.substring(0, 1000) + "... [TRUNCATED]");
        
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
            const parsed = JSON.parse(match[1]);
            console.log("\nParsed successfully! Citations found:", parsed.citations?.length);
            console.log("References found:", parsed.references?.length);
            console.log("Sample citation:", parsed.citations[0]?.quote);
        } else {
            console.log("Could not find JSON block.");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

testPrompt();
