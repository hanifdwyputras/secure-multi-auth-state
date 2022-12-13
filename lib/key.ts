import { ok as isOkay } from 'node:assert'
import { type BinaryLike, scrypt } from 'node:crypto'
import { type GeneratedKey } from './@types'

const scryptPromise = async(pwd: BinaryLike, salt: BinaryLike, keyLen: number): Promise<Buffer> => {
	return await new Promise((resolve, reject) => {
		scrypt(pwd, salt, keyLen, (err, result) => {
			if(err) {
				return reject(err)
			} else {
				return resolve(result)
			}
		})
	})
}

/**
 * Generate key for encrypt, and decrypt
 * @param {Buffer | string} key A Password to encrypt/decrypt
 * @param {Buffer | string} salt A salt for your password
 * @return {Promise<GeneratedKey>} a key
 */
export const generateKey = async(key: Buffer | string, salt: Buffer | string): Promise<GeneratedKey> => {
	isOkay(key instanceof Buffer || typeof key === 'string', 'Invalid key')
	isOkay(salt instanceof Buffer || typeof salt === 'string', 'Invalid salt')

	const keyResult = await scryptPromise(key, salt, 32),
		  iv = await scryptPromise(key, salt, 16)

	return {
		key: keyResult,
		iv,
	}
}
