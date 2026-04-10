export interface SerializedPreKeyBundle {
  registrationId: number;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKey: {
    keyId: number;
    publicKey: string;
  } | null;
}

export interface SerializedKeyPair {
  pubKey: string;
  privKey: string;
}
