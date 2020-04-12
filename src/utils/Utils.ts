import { customAlphabet } from "nanoid";
import Peer, { DataConnection } from "peerjs";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);
export function generateId() {
  return nanoid();
}

export function createPeer() {
  return new Promise<Peer>((resolve, reject) => {
    const peer = new Peer(generateId());

    peer.on("open", id => {
      resolve(peer);
    });
    peer.on("error", err => {
      reject(err);
    });
  });
}

export function connectToPeer(peer: Peer, id: string) {
  return new Promise<DataConnection>((resolve, reject) => {
    const connection = peer.connect(id);

    connection.on("open", () => {
      resolve(connection);
    });
    connection.on("error", err => {
      reject(err);
    });
  });
}
