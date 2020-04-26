import { customAlphabet } from "nanoid";
import Peer from "peerjs";
//@ts-ignore
import freeice from "freeice";
import { proxyUrl } from "../constants/constants";

const nanoid = customAlphabet(
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);
export function generateId() {
  return nanoid();
}

export function createPeer() {
  return new Promise<Peer>((resolve, reject) => {
    const peer = new Peer(generateId(), {
      host: "llllllll.link",
      port: 9000,
      secure: true,
      path: "/peer",
      config: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302"
          },
          {
            urls: "stun:llllllll.link:443",
            username: "ficha",
            credential: "R0J3Y88GsjVYvbdI8m6H"
          },
          {
            urls: "turn:llllllll.link:443",
            username: "ficha",
            credential: "R0J3Y88GsjVYvbdI8m6H"
          }
        ],
        iceTransportPolicy: "all"
      }
      // debug: 3
    });

    peer.on("open", id => {
      resolve(peer);
    });
    peer.on("error", err => {
      reject(err);
    });
  });
}

export async function loadJson(url: string) {
  const response = await fetch(`${proxyUrl}/${url}`, {
    mode: "cors"
  });

  return await response.json();
}
