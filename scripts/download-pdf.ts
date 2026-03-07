import fs from "fs/promises";
import path from "path";
// Using PDFParser from pdf2json
import PDFParser from "pdf2json";

async function parsePDF(pdfPath: string, mdPath: string, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = returns raw text

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            console.error(errData.parserError);
            reject(errData.parserError);
        });

        pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
            try {
                // The raw text is stored in pdfParser.getRawTextContent()
                const text = pdfParser.getRawTextContent();
                const mdContent = `# ${fileName}\n\n${text}`;
                await fs.writeFile(mdPath, mdContent);
                console.log(`Saved Markdown to ${mdPath}`);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        pdfParser.loadPDF(pdfPath);
    });
}

async function downloadAndParse(url: string, expertFolder: string, fileName: string) {
    const knowDir = path.join(process.cwd(), "public", "know", expertFolder, fileName);
    await fs.mkdir(knowDir, { recursive: true });
    
    console.log(`Downloading ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const pdfPath = path.join(knowDir, "document.pdf");
        await fs.writeFile(pdfPath, buffer);
        console.log(`Saved PDF to ${pdfPath}`);
        
        console.log(`Parsing PDF...`);
        const mdPath = path.join(knowDir, "content.md");
        await parsePDF(pdfPath, mdPath, fileName);
        
    } catch (e) {
        console.error(`Failed to process ${url}:`, e);
    }
}

async function main() {
    await downloadAndParse(
        "https://patrimoniobiocultural.com/archivos/publicaciones/libros/El_patrimonio_biocultural.pdf",
        "BOEGE_SCHMIDT_Eckart",
        "El_patrimonio_biocultural"
    );
    
    await downloadAndParse(
        "https://palido.deluz.com.mx/numero-180/180-la-clase/1463-180-educacion-ambiental/2408-xochitla-un-lugar-donde-florecio-el-trabajo-y-tambien-sus-trabajadores?tmpl=component&format=pdf",
        "MARTINEZ_GONZALEZ_Hilda_Lorena",
        "Xochitla"
    );
}

main();