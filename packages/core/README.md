Emisor core
=========================
:construction: work in progress

## Events
Emisor supports 2 type of events, `Symbol` and `string`. `String` based events are more powerful then the "simpler" `Symbol` based events. `String` based events support namespaces, the default namespace separator is `.`.

### Channel filter
Channel filters can only be used by `string` based events and the following filters are supported:
- Wildcard `*`

You can only filter on 1 or more namespaces you can not filter on the event substring, meaning that `test.*` is valid filter and `test*` is a invalid filter.

#### Wildcard filter: `*`

| usage | description |
| - | - |
| `*` | subscribe to any event |
| `namespace.*` | subscribe to any event that starts with the namespace as well to the exact match of the namespace | 
| `namespace.*.namespace` | You can use a wildcard for one part of the namespace. |

```js
Emitter.on('test.*', (d) => console.log(d));
//This will trigger the subscriber
Emitter.emit('test', 1);
//but also any event that starts with the test namespace
Emitter.emit('test.test', 2);
Emitter.emit('test.test.etc', 3);
```

```js
Emitter.on('car.*.door.open', (d) => console.log(d));
//These events will trigger the subscriber
Emitter.emit('car.left.door.open', true);
Emitter.emit('car.right.door.open', true);
```

### Plugin postfix
Some plugin support to set options via the postfix of the event `string`, for example the count plugin can be triggered via `this.should.be.called.once:#1`. The default postfix separator is `:`

### Plugin prefix
:construction: work in progress

## Methods

### `on`
Subscribe to a event.

#### params
| name | type | description |
| - | - | - |
| event | `string|Symbol` | event to subscribe to |
| handler | `function` | event handler |
| options | `object` | options that wil trigger plugins |


The handler will receive 2 params the first one the `payload` of the triggered event, second one the `$event` object that will have the following property:


| key | type | description |
| - | - | - |
| time | `number` | unix timestamp of publish time |
| event | `string|Symbol` | event that triggered the handler |
| handler | `function` | the handler it self |
| tag | `*` | events can have tags, mostly used by plugins |


### `off`
unsubscribe from a event
* If no `event` is given, all subscribers will be unsubscribed
* if no `handler` is given all subscribers of the given `event` will be unsubscribed


#### params
| name | type | description |
| - | - | - |
| event | `string|Symbol` | unsubscribe to a specific event |
| handler | `function` | unsubscribe to a specific handler |

### `emit`
Emit a event

#### params
| name | type |
| - | - | - |
| event | `string|Symbol` |
| payload | `any` | 
