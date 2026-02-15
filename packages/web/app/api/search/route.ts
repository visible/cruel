import { createFromSource } from "fumadocs-core/search/server"
import { source } from "@/lib/source"

const search = createFromSource(source)
const cache = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800"

export const runtime = "nodejs"

export async function GET(request: Request): Promise<Response> {
	const response = await search.GET(request)
	const headers = new Headers(response.headers)
	headers.set("cache-control", cache)

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	})
}
