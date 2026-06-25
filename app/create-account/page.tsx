import AuthSignUpPage from "@/app/auth/sign-up/page";

type CreateAccountPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function CreateAccountPage(props: CreateAccountPageProps) {
  return AuthSignUpPage(props);
}
