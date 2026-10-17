import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FolderOpen } from "lucide-react";

import AppHeader from "~/components/AppHeader";
import defaultProfileIcon from "~/assets/default profile icon.jpg";
import ProfileMenu from "~/components/ProfileMenu";
import { ShareModal } from "~/components/ShareModal";
import { ShareUnlock } from "~/components/ShareUnlock";
import { Button } from "~/components/ui/Button";
import VideoMoreMenu from "~/components/VideoMoreMenu";
import VideoPlayer from "~/components/VideoPlayer";
import { api } from "~/utils/api";
import { getTime } from "~/utils/getTime";

const VideoPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const { videoId } = router.query as { videoId: string };
  const query = api.video.get.useQuery(
    { videoId },
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => error?.data?.code !== "FORBIDDEN" && failureCount < 2,
    }
  );
  const video = query.data;

  if (video?.locked) {
    const folderUnlock = video.unlockScope === "folder" && video.folder;
    return (
      <>
        <Head><title>{video.title} | Agilize IA</title></Head>
        <ShareUnlock
          scope={video.unlockScope}
          targetId={folderUnlock ? folderUnlock.id : video.id}
          title={folderUnlock ? folderUnlock.name : video.title}
          onUnlocked={() => query.refetch()}
        />
      </>
    );
  }

  if (!query.isLoading && !video) {
    return (
      <main className="min-h-screen bg-navy-50">
        <Head><title>Demonstração indisponível | Agilize IA</title></Head>
        <AppHeader />
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-xl place-items-center px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-navy-600">Link indisponível</p>
            <h1 className="mt-2 text-3xl font-bold text-navy-900">Esta demonstração não está disponível</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">O link pode ter expirado ou o compartilhamento foi desativado.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{video?.title ? `${video.title} | Agilize IA` : "Demonstrações — Agilize IA"}</title>
        {video ? <meta property="og:image" content={video.thumbnailUrl} /> : null}
        <meta name="description" content="Assista a uma demonstração da Agilize IA" />
      </Head>
      <main className="min-h-screen bg-navy-50">
        <AppHeader
          actions={
            <>
              {video?.isOwner ? <><VideoMoreMenu video={video} /><ShareModal video={video} /></> : null}
              {status === "authenticated" ? <><Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/videos">Biblioteca</Link></Button><ProfileMenu /></> : null}
            </>
          }
        />

        <section className="mx-auto w-full max-w-[1184px] px-4 py-6 sm:px-8 sm:py-8">
          {video?.folder ? (
            <div className="mx-auto mb-3 flex w-full max-w-[1120px] items-center justify-between border border-line bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FolderOpen className="h-5 w-5 shrink-0 text-navy-600" />
                <div className="min-w-0"><p className="text-xs text-muted-foreground">Pasta</p><p className="truncate text-sm font-semibold text-navy-900">{video.folder.name}</p></div>
              </div>
              <Button asChild variant="outline" size="sm"><Link href={`/folders/${video.folder.id}`}>Ver pasta</Link></Button>
            </div>
          ) : null}

          <div className="mx-auto w-full max-w-[1120px] border border-line bg-navy-900">
            <div className="aspect-video w-full">
              {video?.video_url ? <VideoPlayer thumbnailUrl={video.thumbnailUrl} video_url={video.video_url} /> : <div className="h-full w-full animate-pulse bg-navy-800" />}
            </div>
          </div>

          <div className="mx-auto mt-5 flex w-full max-w-[1120px] flex-col gap-5 border-l-2 border-signal pl-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {video ? <><h1 className="break-words text-xl font-bold text-navy-900 sm:text-2xl">{video.title}</h1><p className="mt-1 text-sm text-muted-foreground">{getTime(video.createdAt)}</p></> : <div className="animate-pulse"><div className="h-6 w-72 max-w-full bg-navy-100" /><div className="mt-2 h-4 w-24 bg-navy-100" /></div>}
            </div>
            {video ? (
              <div className="flex shrink-0 items-center gap-3">
                <Image src={video.user.image ?? defaultProfileIcon} alt={`Foto de ${video.user.name ?? "autor"}`} width={36} height={36} className="h-9 w-9 rounded-full object-cover" unoptimized />
                <div><p className="text-xs text-muted-foreground">Criado por</p><p className="text-sm font-semibold text-foreground">{video.user.name}</p></div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
};

export default VideoPage;
