let text = `----------------Page (0)----------------
El patrimonio biocultural de los pueblos indíge-
nas de México: hacia la conservación in situ
de la biodiversidad y agrodiversidad

Este es un nuevo párrafo.
Tiene dos oraciones.`;

// 1. Normalize line endings
text = text.replace(/\r\n/g, "\n");

// 2. Format page markers: "----------------Page (1)----------------" -> "\n\n[Página 1]\n\n"
text = text.replace(/-+Page \((\d+)\)-+/g, "\n\n[Página $1]\n\n");

// 3. Fix hyphenated words at the end of a line
text = text.replace(/-\n+/g, "");

// 4. Merge sentences broken by single newlines. 
text = text.replace(/(?<!\n)\n(?!\n)/g, " ");

// 5. Clean up tabs and excessive spaces
text = text.replace(/\t/g, " ");
text = text.replace(/ {2,}/g, " ");

// 6. Ensure no more than 2 consecutive newlines
text = text.replace(/\n{3,}/g, "\n\n");

text = text.trim();
console.log(text);
