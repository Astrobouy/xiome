
import {LitElement, PropertyValues} from "lit"
import {mixinAutowatcher} from "./mixins/mixin-autowatcher.js"
import {mixinInitiallyHidden} from "./mixins/mixin-initially-hidden.js"

export * from "lit"
export * from "lit/decorators.js"

export * from "./mixins/mixin-autotrack.js"
export * from "./mixins/mixin-autowatcher.js"
export * from "./mixins/mixin-happy.js"
export * from "./mixins/mixin-focusable.js"
export * from "./mixins/mixin-initially-hidden.js"
export * from "./mixins/mixin-light-dom.js"
export * from "./mixins/mixin-share.js"
export * from "./mixins/mixin-styles.js"

export * from "./theme-components.js"
export * from "./register-components.js"

export class Component extends mixinInitiallyHidden(LitElement) {
	init() {}
	firstUpdated(changes: PropertyValues) {
		super.firstUpdated(changes)
		this.init()
	}
}

export class ComponentWithShare<xShare> extends Component {
	readonly share: xShare

	constructor() {
		super()
		if (this.share === undefined)
			throw new Error("component requires share")
	}
}

export class AutowatcherComponent extends mixinAutowatcher(mixinInitiallyHidden(LitElement)) {
	init() {}
	firstUpdated(changes: PropertyValues) {
		this.init()
		super.firstUpdated(changes)
	}
}

export class AutowatcherComponentWithShare<xShare> extends AutowatcherComponent {
	readonly share: xShare

	constructor() {
		super()
		if (this.share === undefined)
			throw new Error("component requires share")
	}
}
