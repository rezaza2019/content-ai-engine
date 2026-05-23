import { Destination } from "../types/destination";

const readError = async (response: Response) => {
  try {
    const body = await response.json();
    return body.error || body.message || response.statusText;
  } catch {
    return response.statusText;
  }
};

export async function fetchDestinations(): Promise<Destination[]> {
  const response = await fetch("/api/wp/destinations");

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function createDestination(
  destination: Partial<Destination>,
): Promise<number> {
  const response = await fetch("/api/wp/destinations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(destination),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const created: Destination = await response.json();
  return Number(created.id);
}

export async function updateDestination(destination: Destination) {
  if (!destination.id) {
    throw new Error("Destination ID is required.");
  }

  const response = await fetch(`/api/wp/destinations/${destination.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(destination),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function deleteDestination(destinationId: string | number) {
  const response = await fetch(`/api/wp/destinations/${destinationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
