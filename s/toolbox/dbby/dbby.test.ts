
import {Suite, expect, assert} from "cynic"

import {getRando} from "../get-rando.js"
import {dbbyMemory} from "./dbby-memory.js"
import {DamnId} from "../damnedb/damn-id.js"
import {dbbyHardback} from "./dbby-hardback.js"
import {and, or, find} from "./dbby-helpers.js"
import {dbbyConstrain} from "./dbby-constrain.js"
import {DbbyRow, DbbyTable} from "./dbby-types.js"

type DemoUser = {
	userId: string
	balance: number
	location: string
}

async function setupThreeUserDemo() {
	const dbby = await dbbyMemory<DemoUser>()
	await Promise.all([
		dbby.create({userId: "u123", balance: 100, location: "america"}),
		dbby.create({userId: "u124", balance: 0, location: "canada"}),
		dbby.create({userId: "u125", balance: -100, location: "canada"}),
	])
	return dbby
}

function constrainAppTable<xTable extends DbbyTable<DbbyRow>>(
			table: xTable,
			appId: string,
		) {
	return dbbyConstrain<{appId: string}, xTable>({namespace: {appId}, table})
}

export default <Suite>{
	"dbby-hardback": {
		"read": async() => {
			const frontTable = await setupThreeUserDemo()
			const backTable = await dbbyMemory<DemoUser>()
			await backTable.create({userId: "u92", balance: 92, location: "victoria"})
			const combinedTable = dbbyHardback({frontTable, backTable})
			const result01 = await combinedTable.read({conditions: false})
			const result02 = await combinedTable.read(find({userId: "u92"}))
			expect(result01.length).equals(4)
			expect(result02.length).equals(1)
		},
	},
	"dbby-constrain": {
		"read all rows from constrained table": async() => {
			const dbby = await dbbyMemory<DemoUser>()
			const alpha = constrainAppTable(dbby, "a1")
			await alpha.create(
				{userId: "u1", balance: 101, location: "canada"},
				{userId: "u2", balance: 102, location: "america"},
			)
			const results = await alpha.read({conditions: false})
			expect(results.length).equals(2)
		},
		"apply app id constraint": async() => {
			const dbby = await dbbyMemory<DemoUser>()
			const a1 = constrainAppTable(dbby, "a1")
			const a2 = constrainAppTable(dbby, "a2")
			await a1.create({userId: "u1", balance: 100, location: "america"})
			await a2.create({userId: "u2", balance: 100, location: "canada"})
			await a2.delete(find({userId: "u1"}))
			let failed = false
			try {
				await a1.update({...find({location: "canada"}), write: {balance: 99}})
			}
			catch (error) {
				failed = true
			}
			const users = await dbby.read({conditions: false})
			const canadian = await dbby.one(find({location: "canada"}))
			return expect(users.length).equals(2)
				&& expect(canadian.balance).equals(100)
				&& expect(failed).ok()
		},
	},
	"dbby-memory": {
		"create rows and read 'em back unconditionally": async() => {
			const dbby = await setupThreeUserDemo()
			const falseResults = await dbby.read({conditions: false})
			return expect(falseResults.length).equals(3)
		},
		"empty and/or conditions explode": async() => {
			const dbby = await setupThreeUserDemo()
			await expect(async() => dbby.read({conditions: and()})).throws()
			await expect(async() => dbby.read({conditions: or()})).throws()
		},
		"read one": async() => {
			const dbby = await setupThreeUserDemo()
			expect(
				await dbby.one({conditions: and({equal: {userId: "u123"}})})
			).ok()
		},
		"ignore undefined conditions": async() => {
			const dbby = await setupThreeUserDemo()
			const result = await dbby.one({conditions: and({equal: {userId: "u123"}}, undefined)})
			expect(result.userId).equals("u123")
		},
		"read one with not set condition": async() => {
			const dbby = await setupThreeUserDemo()
			await dbby.create({userId: "u999", balance: 1, location: undefined})
			return expect(
				(await dbby.one({
					conditions: and({notSet: {location: true}})
				})).userId
			).equals("u999")
		},
		"assert one": async() => {
			const dbby = await setupThreeUserDemo()
			const fallback: DemoUser = {
				userId: "u000",
				balance: 1000,
				location: "russia",
			}
			return (true
				&& expect(
						(await dbby.assert({
							conditions: and({equal: {userId: "u123"}}),
							make: async() => fallback,
						})).location
					).equals("america")
				&& expect(
						(await dbby.assert({
							conditions: and({equal: {userId: "u000"}}),
							make: async() => fallback,
						})).location
					).equals("russia")
			)
		},
		"read sorting via order": async() => {
			const dbby = await setupThreeUserDemo()
			const result1 = await dbby.read({conditions: false, order: {balance: "ascend"}})
			const result2 = await dbby.read({conditions: false, order: {balance: "descend"}})
			return expect(result1[0].balance).equals(-100)
				&& expect(result2[0].balance).equals(100)
		},
		"read pagination, limit and offset": async() => {
			const dbby = await setupThreeUserDemo()
			const result1 = await dbby.read({conditions: false, limit: 2})
			const result2 = await dbby.read({conditions: false, limit: 2, offset: 1})
			return expect(result1.length).equals(2)
				&& expect(result2[0].userId).equals("u124")
		},
		"read with single conditions": async() => {
			const dbby = await setupThreeUserDemo()
			return (true
				&& expect([
						...await dbby.read({conditions: and({equal: {userId: "u123"}})}),
						...await dbby.read({conditions: and({equal: {userId: "u124"}})}),
						...await dbby.read({conditions: and({equal: {userId: "u125"}})}),
					].length).equals(3)
				&& expect((
						await dbby.read({conditions: and({
							greater: {balance: 50},
							equal: {location: "america"},
						})})
					).length).equals(1)
				&& expect((
						await dbby.read({conditions: and({
							notEqual: {location: "america"}
						})})
					).length).equals(2)
				&& expect((
						await dbby.read({conditions: and({less: {balance: 50}})})
					).length).equals(2)
				&& expect((
						await dbby.read({conditions: and({search: {location: "can"}})})
					).length).equals(2)
				&& expect((
						await dbby.read({conditions: and({search: {location: /can/}})})
					).length).equals(2)
			)
		},
		"read with multiple conditions": async() => {
			const dbby = await setupThreeUserDemo()
			return (true
				&& expect(
					(await dbby.read({
						conditions: and(
							{less: {balance: 200}},
							{equal: {location: "canada"}},
						)
					})).length
				).equals(2)
				&& expect(
					(await dbby.read({
						conditions: or(
							{less: {balance: 50}},
							{equal: {location: "america"}},
						)
					})).length
				).equals(3)
				&& expect(
					(await dbby.read({
						conditions: or(
							and(
								{less: {balance: 50}},
								{equal: {location: "canada"}},
							),
							{equal: {location: "greenland"}},
						)
					})).length
				).equals(2)
			)
		},
		"delete a row and it's gone": async() => {
			const dbby = await setupThreeUserDemo()
			await dbby.delete({conditions: and({equal: {userId: "u123"}})})
			const users = await dbby.read({conditions: false})
			return expect(users.length).equals(2)
		},
		"update write to a row": async() => {
			const dbby = await setupThreeUserDemo()
			await dbby.update({
				conditions: and({equal: {userId: "u123"}}),
				write: {location: "argentina"},
			})
			const user = await dbby.one({conditions: and({equal: {userId: "u123"}})})
			return (true
				&& expect(user.location).equals("argentina")
				&& expect(user.balance).equals(100)
			)
		},
		"update whole row": async() => {
			const dbby = await setupThreeUserDemo()
			const userId = "u123"
			await dbby.update({
				conditions: and({equal: {userId}}),
				whole: {userId, balance: 50, location: "argentina"},
			})
			const user = await dbby.one({conditions: and({equal: {userId}})})
			return (true
				&& expect(user.location).equals("argentina")
				&& expect(user.balance).equals(50)
			)
		},
		"update upsert can update or insert": async() => {
			const dbby = await setupThreeUserDemo()
			await Promise.all([
				dbby.update({
					conditions: and({equal: {userId: "u123"}}),
					upsert: {
						userId: "u123",
						balance: 500,
						location: "america",
					},
				}),
				dbby.update({
					conditions: and({equal: {userId: "u126"}}),
					upsert: {
						userId: "u126",
						balance: 1000,
						location: "argentina",
					},
				}),
			])
			const america = await dbby.one({conditions: and({equal: {userId: "u123"}})})
			const argentina = await dbby.one({conditions: and({equal: {userId: "u126"}})})
			return (true
				&& expect(america.balance).equals(500)
				&& expect(argentina.balance).equals(1000)
			)
		},
		"count rows with conditions": async() => {
			const dbby = await setupThreeUserDemo()
			const countAll = await dbby.count({conditions: false})
			const countCanadians = await dbby.count({conditions: and({equal: {location: "canada"}})})
			return (true
				&& expect(countAll).equals(3)
				&& expect(countCanadians).equals(2)
			)
		},
		"save and load damn ids": async() => {
			const rando = await getRando()
			const table = await dbbyMemory<{id: DamnId, a: number}>()
			const a1 = {id: rando.randomId(), a: 1}
			const a2 = {id: rando.randomId(), a: 2}
			await table.create(a1)
			await table.create(a2)
			const b1 = await table.one(find({id: a1.id}))
			const all = await table.read({conditions: false})
			expect(b1.a).equals(1)
			assert(b1.id instanceof DamnId, "recovered id is damnid instance")
		},
	},
}
