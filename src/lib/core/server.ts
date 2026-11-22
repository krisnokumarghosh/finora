import { headers } from "next/headers";

const baseUrl = process.env.BETTER_AUTH_URL;


export const serverMutation = async <T = unknown>(
  path: string,
  data?: unknown,
  methode: string = "POST",
): Promise<T> => {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const options: RequestInit = {
    method: methode,
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${baseUrl}${path}`, options);
  return await res.json();
};

export const serverFetch = async <T>(path: string): Promise<T> => {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { cookie },
    cache: "no-store",
  });

  return res.json() as Promise<T>;
};
