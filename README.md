```
safe-multiauthstate
-------------------

It's a modified original .useMultiAuthState() code to encrypt your session data.

But, why should we encrypt our session data?
Sometimes, we host our whatsapp bots on hosting platforms (e.g. Heroku, and Railway)
And, we need to rescan the QR to login. I thought, it was very complicated.

So, with this module. You can save your session publicly. However, you need to specify a secret key to encrypt/decrypt your session data.

I think, it's not a best practice to secure your session data. But, this is only an alternative.

------
```

### Example
```ts
import { useSafeMultiAuthState, generateKey } from 'safe-multiauthstate';

// generateKey is an alias for scrypt(pwd, salt, keylen, ...)
const key = generateKey('secret key', 'salt');

const state = await useSafeMultiAuthState(key, 'folder');
```