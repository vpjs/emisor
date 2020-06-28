History Plugin for Emisor
=========================
This plugin will create a history of every or specific events that are published, what can be replayed on subscribe.

### Plugin options

| key | type | default | description |
| - | - | - | - |
| mode | `Symbol` | `MODE_DEFAULT_ALLOW` | `MODE_DEFAULT_ALLOW` = allow history on every event and deny history on events listed inside the `events` options. `MODE_DEFAULT_DENY` = deny history on every event and allow history on events listed inside the `events` options. |
| events | `Array<Symbol|string>` | `[]` | see mode, allow or deny history on listed events |
| key | `string` | `history` | |
| maxLength | `number` | `1` | max history length |

### History options
the `history` option allowed 2 type of values `boolean` e.q. `true` and any `number` higher then `0`. If `history` is set to `true` it will replay the full history. When given a `number` it will only replay that amount of history.

## Examples

### default
```js
import { EmisorCore } from '@emisor/core';
import { EmisorPluginHistory } from '@emisor/plugin-history';
 let Emitter = new EmisorCore({
      plugins: [
        new EmisorPluginHistory()
      ]
    });
//subscribe once
Emitter.emit('test', 1)
Emitter.on('test', (d) => console.log('data', d), { history: true }); //will log "data 1"
```

### mode
```js
import { EmisorCore } from '@emisor/core';
import { EmisorPluginHistory, MODE_DEFAULT_DENY } from '@emisor/plugin-history';
 let Emitter = new EmisorCore({
      plugins: [
        new EmisorPluginHistory({
          mode: MODE_DEFAULT_DENY
          events: ['test2']
        })
      ]
    });

Emitter.emit('test', 1) 
Emitter.emit('test2', 2)
Emitter.on('test', (d) => console.log('data', d), { history: true }); //will not trigger the history
Emitter.on('test2', (d) => console.log('data', d), { history: true }); //will log "data2"

```

### maxLength
```js
import { EmisorCore } from '@emisor/core';
import { EmisorPluginHistory } from '@emisor/plugin-history';
 let Emitter = new EmisorCore({
      plugins: [
        new EmisorPluginHistory({
          maxLength: 3
        })
      ]
    });
Emitter.emit('test', 1) 
Emitter.emit('test', 2)
Emitter.emit('test', 3)
Emitter.emit('test', 4)
//this will log: "data2", "data3", "data4"
Emitter.on('test', (d) => console.log('data', d), { history: true });
//this will log: "data3", "data4"
Emitter.on('test', (d) => console.log('data', d), { history: 2 });
```