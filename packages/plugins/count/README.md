Count Plugin for Emisor
======================
This plugin add support for subscribing for a x amount of time to a event

### Plugin options

| key | type | default | description |
| - | - | - | - |
| key | `string` | `count ` | |

### count options
the `count` option should always be a number what will be the max amount of time the subscriber can be triggered 

## Examples

```js
import { EmisorCore } from '@emisor/core';
import { EmisorPluginCount } from '@emisor/plugin-count';
 let Emitter = new EmisorCore({
      plugins: [
        new EmisorPluginCount()
      ]
    });
//subscribe once
Emitter.on('test', () => console.count('test'), { count: 1 });

Emitter.emit('test') //will log "test: 1"
Emitter.emit('test') //will log nothing

//subscribe 3
Emitter.on('test', () => console.count('test'), { count: 3 });

Emitter.emit('test') //will log "test: 1"
Emitter.emit('test') //will log "test: 2"
Emitter.emit('test') //will log "test: 3"
Emitter.emit('test') //will log nothing
```
