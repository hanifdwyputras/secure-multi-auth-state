import test from 'ava'
import { resolve as pathResolve } from 'node:path'
import { generateKey, useSafeMultiAuthState } from '../lib'

let key!: Awaited<ReturnType<typeof generateKey>>
test.before('Declare key', async(t) => {
	key = await generateKey('adasdasd', 'asdsadsad')

	t.not(key, undefined)
})

test('init credentials', async(t) => {
	t.log('Initializing creds')
	await t.notThrowsAsync(useSafeMultiAuthState(key, pathResolve(__dirname, 'sessions')))
})

test('credentials change', async(t) => {
	t.log('Preparing state')
	const state = await useSafeMultiAuthState(key, pathResolve(__dirname, 'sessions'))
	t.not(state, undefined)

	state.state.creds.me = {
		'id': '628381928192',
		'name': 'John Doe',
	}

	state.state.creds.platform = 'iOS'

	await t.notThrowsAsync(state.saveCreds)
})

test('validate credentials change', async(t) => {
	t.log('Preparing state')
	const state = await useSafeMultiAuthState(key, pathResolve(__dirname, 'sessions'))
	t.not(state, undefined)

	t.log(state.state.creds)
	t.deepEqual(state.state.creds.me?.id, '628381928192')
	t.deepEqual(state.state.creds.me?.name, 'John Doe')
	t.is(state.state.creds.platform, 'iOS')
})

test('key set 123 -> hello', async(t) => {
	t.log('Preparing state')
	const state = await useSafeMultiAuthState(key, pathResolve(__dirname, 'sessions'))
	t.not(state, undefined)

	await t.notThrowsAsync(async() => state.state.keys.set({
		'session': {
			'123': 'hello',
		}
	}))
})

test('key get 123 -> hello', async(t) => {
	t.log('Preparing state')
	const state = await useSafeMultiAuthState(key, pathResolve(__dirname, 'sessions'))
	t.not(state, undefined)

	const res = await state.state.keys.get('session', ['123'])
	t.log(res)

	t.is(res[123], 'hello')
})
