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
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun.l.google.com:19302?transport=udp"
            ]
          },
          {
            urls: "turn:0.peerjs.com:3478",
            username: "peerjs",
            credential: "peerjsp"
          }
        ],
        iceTransportPolicy: "all"
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
