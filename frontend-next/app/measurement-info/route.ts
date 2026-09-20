export const dynamic = "force-dynamic";
export function GET() {
  if (process.env.MEASUREMENT_DATABASE_ONLY !== "true") return new Response(null, { status: 404 });

  return Response.json(
    { production: process.env.NODE_ENV === "production",
      api: process.env.NEXT_PUBLIC_API_URL,
      renderer: "react-client"
    });
}
