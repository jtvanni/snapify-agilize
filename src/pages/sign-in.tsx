import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { getServerSession } from "next-auth";
import { getProviders, signIn } from "next-auth/react";

import Brand from "~/components/Brand";
import { Button } from "~/components/ui/Button";
import { authOptions } from "~/server/auth";

const SignIn = ({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <>
      <Head>
        <title>Entrar | Demonstrações — Agilize IA</title>
        <meta
          name="description"
          content="Acesso interno às demonstrações da Agilize IA"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="grid min-h-screen bg-navy-50 px-4 py-10 sm:place-items-center">
        <section className="mx-auto w-full max-w-md border border-line bg-white p-6 sm:p-8">
          <Brand href={undefined} className="mb-10" />
          <div className="border-l-2 border-signal pl-4">
            <p className="text-sm font-semibold text-navy-600">Acesso interno</p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em] text-navy-900">
              Entre para acessar as demonstrações
            </h1>
          </div>

          <div className="mt-8 grid gap-3">
            {Object.values(providers).map((provider) => (
              <Button
                key={provider.id}
                type="button"
                size="default"
                className="w-full"
                onClick={() =>
                  void signIn(provider.id, {
                    callbackUrl: provider.callbackUrl,
                  })
                }
              >
                Continuar com {provider.name}
              </Button>
            ))}
          </div>

          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Somente colaboradores autorizados podem acessar este ambiente.
          </p>
        </section>
      </main>
    </>
  );
};

export default SignIn;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return { redirect: { destination: "/videos", permanent: false } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  };
}
