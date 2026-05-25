import { Deal } from "../types/deal";

const readError = async (response: Response) => {
  try {
    const body = await response.json();
    return body.error || body.message || response.statusText;
  } catch {
    return response.statusText;
  }
};

export async function fetchDeals(): Promise<Deal[]> {
  const response = await fetch("/api/wp/deals");

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function deleteDeal(dealId: string | number) {
  const response = await fetch(`/api/wp/deals/${dealId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
