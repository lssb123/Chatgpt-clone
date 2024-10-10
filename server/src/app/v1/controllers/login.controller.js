import logger from "../../../../../logger.js";
import config from "../../../../../config.js";
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import CryptoJS from "crypto-js";

function decryptValue(value) {
    const key = CryptoJS.enc.Utf8.parse(VITE_HUBBLE_KEY);
    const iv = CryptoJS.enc.Utf8.parse(VITE_HUBBLE_KEY);
    const decrypted = CryptoJS.AES.decrypt(value, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function LoginProcess( req, res) {
    const { loginId, password } = req.body;

    try {
        // Decrypt the incoming data
        const decryptedUsername = decryptValue(loginId);
        const decryptedPassword = decryptValue(password);
    }catch(err) {
        
    }
}