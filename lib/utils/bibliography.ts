import { Reference } from "../types";

export function formatAPA7(ref: Reference, authorName: string): string {
  // Extracting surname and initials
  const nameParts = authorName.split(" ").filter(p => p.length > 2);
  const firstName = nameParts[nameParts.length - 1] || "";
  const firstSurname = nameParts[0] || "";
  const initial = firstName.charAt(0);
  const author = `${firstSurname}, ${initial}.`;

  const year = ref.year ? `(${ref.year})` : "(s.f.)";
  const title = ref.title;

  switch (ref.type) {
    case "article":
      const magazine = ref.magazine ? `*${ref.magazine}*` : "";
      const volume = ref.volume ? `, ${ref.volume}` : "";
      const issue = ref.issue ? `(${ref.issue})` : "";
      const pages = ref.pages ? `, ${ref.pages}` : "";
      const doi = ref.doi ? `. https://doi.org/${ref.doi}` : "";
      return `${author} ${year}. ${title}. ${magazine}${volume}${issue}${pages}${doi}.`.replace(/\.\./g, ".");

    case "book":
      const publisher = ref.publisher ? `. ${ref.publisher}` : "";
      const edition = ref.edition ? ` (${ref.edition} ed.)` : "";
      const city = ref.city ? `. ${ref.city}` : "";
      return `${author} ${year}. *${title}*${edition}${city}${publisher}.`.replace(/\.\./g, ".");

    case "thesis":
      return `${author} ${year}. *${title}* [Tesis de grado]. ${ref.publisher || ""}.`.replace(/\.\./g, ".");

    default:
      return `${author} ${year}. ${title}. ${ref.publisher || ""}`.trim() + ".";
  }
}
