'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
	const router = useRouter()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const res = await fetch('/api/signin', {
			method: 'POST',
			body: JSON.stringify({ username, password }),
			headers: { 'Content-Type': 'application/json' },
		})

		if (res.ok) {
			router.push('/runs')
		} else {
			alert('Invalid credentials')
		}
	}

	return (
		<form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto mt-10 space-y-4">
			<input data-cy="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2" />
			<input data-cy="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2" />
			<button data-cy="submit" type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign In</button>
		</form>
	)
}
