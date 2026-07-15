import CryptoJS from "crypto-js";

const SECRET = "DhanSutra_2026_VeryStrongSecretKey";

export function encryptObject(obj) {

    const salt = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    const key = CryptoJS.PBKDF2(
        SECRET,
        salt,
        {
            keySize: 256 / 32,
            iterations: 100000,
            hasher: CryptoJS.algo.SHA256
        });

    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(obj),
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

    const combined =
        salt.clone()
            .concat(iv)
            .concat(encrypted.ciphertext);

    return CryptoJS.enc.Base64.stringify(combined);
}