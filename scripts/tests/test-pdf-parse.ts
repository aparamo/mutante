import PDFParser from "pdf2json";
import fs from "fs/promises";

async function main() {
  const pdfParser = new PDFParser(null, true);
  
  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
  pdfParser.on("pdfParser_dataReady", () => {
      let text = pdfParser.getRawTextContent();
      console.log(text.substring(0, 1000));
      process.exit(0);
  });

  // Since we don't have a local PDF, let's download a small one or just look at documentation
  console.log("Mocking pdf parse check to see how pages are separated...");
}
main();
