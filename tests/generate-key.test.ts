import test from 'ava'
import { generateKey } from '../lib'

test('no throws generate key, and not undefined', async(t) => {
	await t.notThrowsAsync(generateKey('dsdassd', 'asdsaddsd'))
	t.notDeepEqual(await generateKey('sdadasd', 'dsadadasd'), undefined)
})

test('have valid key, and iv', async(t) => {
	const key = await generateKey('adasdasd', 'sdsadsadw')
	t.not(key, undefined)
	t.assert(key.key instanceof Buffer)
	t.assert(key.iv instanceof Buffer)

	t.is(key.key.length, 32)
	t.is(key.iv.length, 16)
})