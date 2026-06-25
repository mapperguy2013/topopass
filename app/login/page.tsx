import AuthLogInPage from "@/app/auth/log-in/page";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage(props: LoginPageProps) {
  return AuthLogInPage(props);
}
