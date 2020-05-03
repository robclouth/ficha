import { customAlphabet } from "nanoid";
import { proxyUrl } from "../constants/constants";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);

export function generateId() {
  return nanoid();
}

export async function loadJson(url: string) {
  const response = await fetch(`${proxyUrl}/${url}`, {
    mode: "cors"
  });

  return await response.json();
}
