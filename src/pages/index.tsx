import type { GetServerSideProps, NextPage } from "next";
import { getServerAuthSession } from "~/server/auth";

const Home: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession(context);

  return {
    redirect: {
      destination: session ? "/videos" : "/sign-in",
      permanent: false,
    },
  };
};

export default Home;
