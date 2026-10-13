import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="muted mt-2">The page you are looking for does not exist.</p>
      <div className="mt-6">
        <LinkButton href="/">Go home</LinkButton>
      </div>
    </div>
  );
}
