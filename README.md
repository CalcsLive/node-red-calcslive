# node-red-contrib-calcslive

Unit-aware calculations for Node-RED via [CalcsLive](https://www.calcslive.com).

## Install

In your Node-RED user directory (`~/.node-red`):

```bash
npm install node-red-contrib-calcslive
```

Or install from the Node-RED palette manager: search for `calcslive`.

## Nodes

### calcslive-calculate

Executes a CalcsLive calculation article as a unit-aware function.

**Config panel properties:**
- **Config** — select a `calcslive-config` credential node
- **Article ID** — the CalcsLive article short ID (e.g. `3LYPD4C96-34U`)
- **Inputs** — JSON object: `{"symbol": {"value": 5, "unit": "m/s"}}`
- **Outputs** — JSON object: `{"symbol": {"unit": "J"}}` (leave empty for all outputs)

**msg overrides** — set before the node to override static config at runtime:
- `msg.articleId` — overrides Article ID
- `msg.inputs` — overrides Inputs JSON
- `msg.outputs` — overrides Outputs JSON

**Outputs:**
- `msg.payload` — calculation outputs: `{"KE": {"value": 125, "unit": "J", "baseValue": 125, "baseUnit": "J"}}`
- `msg.calcslive` — full API response (inputs echo, outputs, usage info)

## Example Flow

```json
[{"id":"inject1","type":"inject","name":"Test","payload":"{}","payloadType":"json","wires":[["calc1"]]},{"id":"calc1","type":"calcslive-calculate","name":"Kinetic Energy","configNodeId":"cfg1","articleId":"YOUR_ARTICLE_ID","inputs":"{\"m\":{\"value\":10,\"unit\":\"kg\"},\"v\":{\"value\":5,\"unit\":\"m/s\"}}","outputs":"","wires":[["debug1"]]},{"id":"debug1","type":"debug","name":"Result","active":true,"wires":[]},{"id":"cfg1","type":"calcslive-config","name":"My CalcsLive"}]
```

## License

MIT
