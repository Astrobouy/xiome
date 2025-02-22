
import {UserAuth} from "../../../auth/types/auth-metas.js"
import {QuestionsTables} from "../tables/types/questions-tables.js"

export interface QuestionsUserAuth extends UserAuth {
	questionsTables: QuestionsTables
}

export interface QuestionsAnonAuth extends UserAuth {
	questionsTables: QuestionsTables
}
