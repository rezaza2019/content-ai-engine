export type TicketProduct = {
  ID: string | number;
  name: string;
  description: string;
  URL: string;
  images: string[];
  price: {
    amount: string | number;
  };
  properties: {
    descriptionLong?: string[];
    brand?: string[];
    [key: string]: unknown;
  };
};

const getFeedItems = (result: any): any[] => {
  if (Array.isArray(result)) return result;
  if (result?.datafeed?.programs?.[0]?.products) {
    return result.datafeed.programs[0].products;
  }
  if (result?.products) return result.products;
  if (result?.items) return result.items;
  return [];
};

const normalizeTicket = (item: any): TicketProduct => {
  const product = item.product_info
    ? { ...item.update_info, ...item.product_info }
    : item;

  return {
    ID: product.sku || product.ID || product.id,
    name: product.title || product.name || product.accommodation_name || "Untitled ticket",
    description: product.description || product.summary || "",
    URL: product.link || product.URL || product.url || "",
    images: [
      product.image,
      product.imageUrl,
      product.main_image,
      product.extra_data?.image,
    ].filter(Boolean),
    price: {
      amount: product.price || product.price_new || product.price_amount || "",
    },
    properties: {
      descriptionLong: [product.description || product.summary || ""].filter(Boolean),
      brand: [product.brand || product.provider || product.program_name].filter(Boolean),
    },
  };
};

export async function fetchTicketDeals(): Promise<TicketProduct[]> {
  const response = await fetch("/api/feed");

  if (!response.ok) {
    throw new Error("Failed to fetch TradeTracker feed.");
  }

  const result = await response.json();
  return getFeedItems(result).map(normalizeTicket);
}
