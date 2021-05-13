
import {Constructor, LitBase} from "../component-types.js"

export function mixinFocusable<C extends Constructor<LitBase>>(Base: C) {
	return class extends Base {
		createRenderRoot() {
			return this
		}
	}
}
