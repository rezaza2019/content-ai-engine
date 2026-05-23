import { Accommodation } from "../types/accommodation";

const readError = async (response: Response) => {
  try {
    const body = await response.json();
    return body.error || body.message || response.statusText;
  } catch {
    return response.statusText;
  }
};

export async function fetchAccommodations(): Promise<Accommodation[]> {
  const response = await fetch("/api/wp/accommodations");

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function createAccommodation(
  accommodation: Partial<Accommodation>,
): Promise<number> {
  const response = await fetch("/api/wp/accommodations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(accommodation),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const created: Accommodation = await response.json();
  return Number(created.id);
}

export async function updateAccommodation(accommodation: Accommodation) {
  if (!accommodation.id) {
    throw new Error("Accommodation ID is required.");
  }

  const response = await fetch(`/api/wp/accommodations/${accommodation.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(accommodation),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function deleteAccommodation(accommodationId: string | number) {
  const response = await fetch(`/api/wp/accommodations/${accommodationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
