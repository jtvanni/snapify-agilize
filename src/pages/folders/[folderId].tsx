import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FolderOpen, Video } from "lucide-react";

import AppHeader from "~/components/AppHeader";
import { FolderShareModal } from "~/components/FolderShareModal";
import { FolderMoreMenu } from "~/components/FolderMoreMenu";
import ProfileMenu from "~/components/ProfileMenu";
import { ShareUnlock } from "~/components/ShareUnlock";
import { Button } from "~/components/ui/Button";
import { api } from "~/utils/api";
import { getTime } from "~/utils/getTime";

const FolderPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const { folderId } = router.query as { folderId: string };
  const query = api.folder.get.useQuery(
    { folderId },
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      retry: (count, error) => error?.data?.code !== "FORBIDDEN" && count < 2,
    }
  );
  const folder = query.data;

  if (folder?.locked) {
    return (
      <>
        <Head><title>{folder.name} | Agilize IA</title></Head>
        <ShareUnlock scope="folder" targetId={folder.id} title={folder.name} onUnlocked={() => query.refetch()} />
      </>
    );
  }

  if (!query.isLoading && !folder) {
    return <main className="min-h-screen bg-navy-50"><AppHeader /><div className="mx-auto grid min-h-[calc(100vh-64px)] place-items-center px-6 text-center"><div><p className="text-sm font-semibold text-navy-600">Link indisponível</p><h1 className="mt-2 text-3xl font-bold text-navy-900">Esta pasta não está disponível</h1></div></div></main>;
  }

  return (
    <>
      <Head><title>{folder ? `${folder.name} | Agilize IA` : "Pasta | Agilize IA"}</title><meta name="description" content="Demonstrações compartilhadas pela Agilize IA" /></Head>
      <main className="min-h-screen bg-navy-50">
        <AppHeader actions={<>{folder?.isOwner ? <><FolderMoreMenu folder={folder} /><FolderShareModal folder={folder} /></> : null}{status === "authenticated" ? <><Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/videos">Biblioteca</Link></Button><ProfileMenu /></> : null}</>} />
        <section className="mx-auto w-full max-w-[1184px] px-4 py-8 sm:px-8 sm:py-10">
          <div className="mb-7 flex items-end justify-between gap-4 border-l-2 border-signal pl-4">
            <div><div className="flex items-center gap-2 text-sm font-semibold text-navy-600"><FolderOpen className="h-4 w-4" />Pasta compartilhada</div><h1 className="mt-1 text-3xl font-bold tracking-[-0.03em] text-navy-900">{folder?.name ?? "Carregando…"}</h1></div>
            {folder ? <span className="hidden text-sm text-muted-foreground sm:block">{folder.videos.length} {folder.videos.length === 1 ? "vídeo" : "vídeos"}</span> : null}
          </div>

          {folder && folder.videos.length === 0 ? (
            <div className="grid min-h-[280px] place-items-center border border-line bg-white p-6 text-center"><div><Video className="mx-auto h-8 w-8 text-navy-600" /><h2 className="mt-4 text-xl font-bold text-navy-900">Pasta vazia</h2><p className="mt-2 text-sm text-muted-foreground">Adicione vídeos pela biblioteca.</p></div></div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-px border border-line bg-line">
              {folder?.videos.map((video) => (
                <Link key={video.id} href={`/share/${video.id}`} className="group min-w-0 bg-white hover:bg-navy-50" aria-label={`Assistir: ${video.title}`}>
                  <article><div className="aspect-video overflow-hidden bg-navy-900"><Image src={video.thumbnailUrl} alt="Miniatura da demonstração" width={640} height={360} unoptimized className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.015]" /></div><div className="min-h-[92px] border-t border-line p-4"><h2 className="line-clamp-2 text-sm font-semibold leading-5">{video.title}</h2><p className="mt-2 text-xs text-muted-foreground">{getTime(video.createdAt)}</p></div></article>
                </Link>
              ))}
              {query.isLoading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse bg-white"><div className="aspect-video bg-navy-100" /><div className="h-[92px] border-t border-line p-4"><div className="h-4 w-4/5 bg-navy-100" /></div></div>) : null}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default FolderPage;
