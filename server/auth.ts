import { auth } from "@/auth";
import { copy } from "@/lib/copy";

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error(copy.errors.unauthorized);
  }
  return session.user.id;
}
