"use client"

import { Client, Provider, cacheExchange, fetchExchange, subscriptionExchange } from "urql"

import { SubscriptionClient } from "subscriptions-transport-ws"

const wsClient =
	typeof window !== "undefined"
		? new SubscriptionClient("ws://localhost:4001/query", {
				reconnect: false,
				lazy: true,
		  })
		: null

export const client = new Client({
	url: "http://localhost:4002/query",
	exchanges: [
		// cacheExchange,
		fetchExchange,

		...(wsClient
			? [
					subscriptionExchange({
						forwardSubscription: (request) => wsClient.request(request),
					}),
			  ]
			: []),
	],
})

export function UrqlWrapper({ children }: React.PropsWithChildren) {
	return <Provider value={client}>{children}</Provider>
}
