import { type AuthenticationCreds, type SignalDataSet, initAuthCreds, SignalDataTypeMap, useMultiFileAuthState, WAProto } from '@adiwajshing/baileys'
import { ok as isOkay } from 'node:assert'
import { createCipheriv, createDecipheriv } from 'node:crypto'
import { createReadStream, createWriteStream, unlink } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { join as pathJoin } from 'node:path'
import { type GeneratedKey } from './@types'

type Action = 'write' | 'read' | 'remove';
const fixFileName = (file?: string) => file?.replace(/\//g, '__')?.replace(/:/g, '-')

export const useSafeMultiAuthState = async(key: GeneratedKey, folder: string): ReturnType<typeof useMultiFileAuthState> => {
	isOkay(key?.key instanceof Buffer)
	isOkay(key?.iv instanceof Buffer)

	const action = async<V>(act: Action, file: string, data?: V): Promise<V> => {
		return await new Promise((resolve, reject) => {
			switch (act) {
			case 'read':
				try {
					let collected = Buffer.alloc(0)
					const decipher = createDecipheriv('aes-256-cbc', key.key, key.iv)
					const fdr = createReadStream(pathJoin(folder, fixFileName(file)!))

					fdr.pipe(decipher).on('data', (ch) => {
						collected = Buffer.concat([collected, Buffer.from(ch)])
					}).on('end', () => {
						return resolve(JSON.parse(collected.toString('utf8')))
					}).on('error', reject)
				} catch{
					return resolve(undefined as V)
				}

				break
			case 'write':
				const cipher = createCipheriv('aes-256-cbc', key.key, key.iv)
				const fdw = createWriteStream(pathJoin(folder, fixFileName(file)!))

				fdw.pipe(cipher)
				fdw.write(JSON.stringify(data), (err) => {
					if(err) {
						return reject(err)
					}
				})
				fdw.close((err) => {
					if(err) {
						return reject(err)
					} else {
						return resolve(undefined as V)
					}
				})
				break
			case 'remove':
				unlink(pathJoin(folder, fixFileName(file)!), (err) => {
					if(err) {
						return reject(err)
					} else {
						return resolve(undefined as V)
					}
				})
			}
		})
	}

	const fileInfo = await stat(folder).catch(() => undefined)
	if(fileInfo && !fileInfo.isDirectory()) {
		throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`)
	} else {
		await mkdir(folder, { recursive: true })
	}

	const creds = await action<AuthenticationCreds>('read', 'creds.json') || initAuthCreds()

	return {
		state: {
			creds,
			keys: {
				get: async(type, ids) => {
					const data: { [_: string]: SignalDataTypeMap[typeof type] } = { }
					await Promise.all(
						ids.map(
							async id => {
								let value = await action('read', `${type}-${id}.json`)
								if(type === 'app-state-sync-key' && value) {
									value = WAProto.Message.AppStateSyncKeyData.fromObject(value)
								}

								data[id] = value
							}
						)
					)

					return data
				},
				set: async(data) => {
					const tasks: Promise<unknown>[] = []
					for(const category in data) {
						for(const id in data[category as keyof SignalDataSet]) {
							const value = data[category as keyof SignalDataSet]![id]
							const file = `${category}-${id}.json`
							tasks.push(value ? action('write', file, value) : action('remove', file))
						}
					}

					await Promise.all(tasks)
				}
			},
		},
		saveCreds: async() => {
			await action('write', 'creds.json', creds)
			return
		}
	}
}
