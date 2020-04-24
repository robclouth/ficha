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
          // {
          //   urls: "stun:stun.l.google.com:19302"
          // },
          // {
          //   urls: "stun:stun1.l.google.com:19302"
          // },
          // {
          //   urls: "stun:stun2.l.google.com:19302"
          // },
          // {
          //   urls: "stun:stun.l.google.com:19302?transport=udp"
          // },
          {
            urls: "stun:llllllll.link:443",
            username: "test",
            credential: "test"
          },
          {
            urls: "turn:llllllll.link:443",
            username: "test",
            credential: "test"
          }
          // {
          //   urls: "numb.viagenie.ca",
          //   username: "rob.clouth@gmail.com",
          //   credential: "ch4Q2%Cr&Y0G"
          // }
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
