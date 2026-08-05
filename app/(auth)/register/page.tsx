import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { copy } from "@/lib/copy";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brain px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">{copy.auth.registerTitle}</CardTitle>
          <CardDescription>{copy.auth.registerSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
