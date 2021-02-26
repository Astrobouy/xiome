
import {Stripe} from "stripe"
import {DbbyRow} from "../../../../../../../toolbox/dbby/dbby-types.js"

export type MockAccount = DbbyRow & Partial<Stripe.Account> & {
	id: string
}
