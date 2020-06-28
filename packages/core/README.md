Emisor core
=========================
work in progress


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
| name | type | description |
| - | - | - |
| event | `string|Symbol` | unsubscribe to a specific event |
| payload | `function` | unsubscribe to a specific handler |
