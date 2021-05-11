
import styles from "./xiome-my-account.css.js"
import {AuthModel} from "../../models/types/auth/auth-model.js"
import {Profile} from "../../types/profile.js"
import {PersonalModel} from "../../models/types/personal/personal-model.js"
import {WiredComponent, html, mixinStyles} from "../../../../framework/component.js"

@mixinStyles(styles)
export class XiomeMyAccount extends WiredComponent<{
		authModel: AuthModel
		personalModel: PersonalModel
	}> {

	// private compositeLoadingView = metaLoadingView(
	// 	this.share.authModel.accessLoadingView,
	// 	this.share.personalModel.personalLoadingView,
	// )

	// private saveProfile = async(profile: Profile) => {
	// 	this.share.personalModel.saveProfile(profile)
	// }

	// render() {
	// 	const {compositeLoadingView} = this
	// 	const {accessLoadingView} = this.share.authModel
	// 	return renderWrappedInLoading(compositeLoadingView, () => html`
	// 		<slot></slot>
	// 		<xio-profile-card
	// 			.user=${accessLoadingView.payload?.user}
	// 			.saveProfile=${this.saveProfile}
	// 		></xio-profile-card>
	// 	`)
	// }
}
