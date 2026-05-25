type GeneratedDestinationContent = {
  content?: string;
  destination_region?: string;
  destination_country?: string;
  destination_name_farsi?: string;
  destination_region_fa?: string;
  destination_country_fa?: string;
  destination_region_description_farsi?: string;
};

export async function generateDestinationContent(
  destinationName: string,
  _language: string,
  fields: string[],
): Promise<GeneratedDestinationContent> {
  const generated: GeneratedDestinationContent = {};

  if (fields.includes("content")) {
    generated.content = `${destinationName} is a travel destination with details ready to enrich.`;
  }

  return generated;
}

export async function parseDestinationInfo(
  text: string,
  _language: string,
): Promise<GeneratedDestinationContent & { title: string }> {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return {
    title: firstLine || "New Destination",
    content: text.trim(),
  };
}
