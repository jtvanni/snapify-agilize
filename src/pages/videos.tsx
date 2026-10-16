import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAtom } from "jotai";

import { api } from "~/utils/api";
import { getTime } from "~/utils/getTime";
import ProfileMenu from "~/components/ProfileMenu";
import NewVideoMenu from "~/components/NewVideoMenu";
import VideoRecordModal from "~/components/VideoRecordModal";
import VideoUploadModal from "~/components/VideoUploadModal";
import uploadVideoModalOpen from "~/atoms/uploadVideoModalOpen";
import recordVideoModalOpen from "~/atoms/recordVideoModalOpen";
import { getServerAuthSession } from "~/server/auth";

const VideoList: NextPage = () => {
  const [, setRecordOpen] = useAtom(recordVideoModalOpen);
  const [, setUploadOpen] = useAtom(uploadVideoModalOpen);
  const { status } = useSession();
  const { data: videos, isLoading } = api.video.getAll.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const openRecordModal = () => {
    if (!navigator?.mediaDevices?.getDisplayMedia) {
      return alert("Your browser does not support screen recording.");
    }
    setRecordOpen(true);
  };

  return (
    <>
      <Head>
        <title>Biblioteca | Agilize IA</title>
        <meta name="description" content="Gravações internas da Agilize IA" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen min-h-screen flex-col items-center bg-[#fbfbfb]">
        <header className="flex min-h-[62px] w-full items-center justify-between border-b border-[#E7E9EB] bg-white px-6">
          <Link href="/videos" className="font-semibold">
            Agilize IA
          </Link>
          <div className="flex items-center">
            <VideoRecordModal />
            <VideoUploadModal />
            <NewVideoMenu />
            {status === "authenticated" && (
              <div className="ml-4">
                <ProfileMenu />
              </div>
            )}
          </div>
        </header>

        <section className="flex w-full grow items-start justify-center overflow-auto pt-14">
          {!isLoading && videos?.length === 0 ? (
            <div className="flex flex-col px-8">
              <span className="text-lg font-semibold text-zinc-700">
                Nenhum vídeo encontrado
              </span>
              <span className="mt-1 text-base text-zinc-500">
                Grave a tela ou envie um vídeo para começar.
              </span>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={openRecordModal}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Gravar vídeo
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Enviar vídeo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid w-full max-w-[1300px] grid-cols-[repeat(auto-fill,250px)] justify-center gap-14 px-4 pb-16">
              {videos?.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
              {isLoading &&
                Array.from({ length: 4 }, (_, index) => (
                  <VideoCardSkeleton key={index} />
                ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: false,
      },
    };
  }

  return { props: {} };
};

interface VideoCardProps {
  title: string;
  id: string;
  thumbnailUrl: string;
  createdAt: Date;
}

const VideoCard = ({ title, id, thumbnailUrl, createdAt }: VideoCardProps) => (
  <Link href={`/share/${id}`}>
    <article className="h-[240px] w-[250px] cursor-pointer overflow-hidden rounded-lg border border-[#6c668533] bg-white text-sm">
      <Image
        src={thumbnailUrl}
        className="h-[140px] w-[248px] object-cover"
        alt="Miniatura do vídeo"
        width={248}
        height={140}
        unoptimized
      />
      <div className="m-4 flex flex-col">
        <span className="line-clamp-2 font-bold">{title}</span>
        <span className="mt-2 text-[#606060]">{getTime(createdAt)}</span>
      </div>
    </article>
  </Link>
);

const VideoCardSkeleton = () => (
  <div className="h-[240px] w-[250px] animate-pulse overflow-hidden rounded-lg border border-[#6c668533]">
    <div className="h-[140px] bg-slate-200" />
    <div className="m-4 space-y-4">
      <div className="h-4 rounded bg-slate-200" />
      <div className="h-4 rounded bg-slate-200" />
    </div>
  </div>
);

export default VideoList;
