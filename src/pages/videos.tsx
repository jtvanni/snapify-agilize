import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAtom } from "jotai";
import { MonitorUp, Video } from "lucide-react";

import AppHeader from "~/components/AppHeader";
import NewVideoMenu from "~/components/NewVideoMenu";
import ProfileMenu from "~/components/ProfileMenu";
import { Button } from "~/components/ui/Button";
import VideoRecordModal from "~/components/VideoRecordModal";
import VideoUploadModal from "~/components/VideoUploadModal";
import recordVideoModalOpen from "~/atoms/recordVideoModalOpen";
import uploadVideoModalOpen from "~/atoms/uploadVideoModalOpen";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/utils/api";
import { getTime } from "~/utils/getTime";

const VideoList: NextPage = () => {
  const [, setRecordOpen] = useAtom(recordVideoModalOpen);
  const [, setUploadOpen] = useAtom(uploadVideoModalOpen);
  const { status } = useSession();
  const { data: videos, isLoading } = api.video.getAll.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const openRecordModal = () => {
    if (!navigator?.mediaDevices?.getDisplayMedia) {
      return alert("Seu navegador não oferece suporte à gravação de tela.");
    }
    setRecordOpen(true);
  };

  return (
    <>
      <Head>
        <title>Biblioteca | Demonstrações — Agilize IA</title>
        <meta name="description" content="Demonstrações internas da Agilize IA" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-navy-50">
        <AppHeader
          actions={
            <>
              <VideoRecordModal />
              <VideoUploadModal />
              <NewVideoMenu />
              {status === "authenticated" ? <ProfileMenu /> : null}
            </>
          }
        />

        <section className="mx-auto w-full max-w-[1184px] px-4 py-8 sm:px-8 sm:py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-navy-600">Acervo interno</p>
              <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em] text-navy-900">
                Biblioteca de demonstrações
              </h1>
            </div>
            {!isLoading && videos?.length ? (
              <span className="hidden text-sm text-muted-foreground sm:block">
                {videos.length} {videos.length === 1 ? "demonstração" : "demonstrações"}
              </span>
            ) : null}
          </div>

          {!isLoading && videos?.length === 0 ? (
            <div className="grid min-h-[320px] place-items-center border border-line bg-white p-6 text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-12 w-12 place-items-center bg-navy-100 text-navy-900">
                  <Video aria-hidden="true" className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-navy-900">
                  Nenhuma demonstração por aqui
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Grave sua tela ou envie um vídeo para começar a montar a biblioteca.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                  <Button onClick={openRecordModal}>
                    <Video className="h-4 w-4" aria-hidden="true" />
                    Gravar tela
                  </Button>
                  <Button variant="outline" onClick={() => setUploadOpen(true)}>
                    <MonitorUp className="h-4 w-4" aria-hidden="true" />
                    Enviar vídeo
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-px border border-line bg-line">
              {videos?.map((video) => <VideoCard key={video.id} {...video} />)}
              {isLoading &&
                Array.from({ length: 8 }, (_, index) => (
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
      redirect: { destination: "/sign-in", permanent: false },
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
  <Link
    href={`/share/${id}`}
    className="group min-w-0 bg-white transition-colors duration-150 ease-out hover:bg-navy-50 focus-visible:z-10"
    aria-label={`Abrir demonstração: ${title}`}
  >
    <article>
      <div className="aspect-video overflow-hidden bg-navy-900">
        <Image
          src={thumbnailUrl}
          className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.015]"
          alt="Miniatura da demonstração"
          width={640}
          height={360}
          unoptimized
        />
      </div>
      <div className="min-h-[92px] border-t border-line p-4">
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">{getTime(createdAt)}</p>
      </div>
    </article>
  </Link>
);

const VideoCardSkeleton = () => (
  <div className="animate-pulse bg-white" aria-hidden="true">
    <div className="aspect-video bg-navy-100" />
    <div className="min-h-[92px] border-t border-line p-4">
      <div className="h-4 w-4/5 bg-navy-100" />
      <div className="mt-3 h-3 w-1/3 bg-navy-100" />
    </div>
  </div>
);

export default VideoList;
