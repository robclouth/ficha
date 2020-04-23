import { customAlphabet } from "nanoid";
import Peer from "peerjs";
//@ts-ignore
import freeice from "freeice";

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
      config: {
        iceServers: freeice(),
        iceTransportPolicy: "relay"
      },
      debug: 3
    });

    peer.on("open", id => {
      resolve(peer);
    });
    peer.on("error", err => {
      reject(err);
    });
  });
}
