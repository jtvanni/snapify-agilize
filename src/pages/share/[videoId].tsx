import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { getTime } from "~/utils/getTime";
import { ShareModal } from "~/components/ShareModal";
import { useSession } from "next-auth/react";
import VideoMoreMenu from "~/components/VideoMoreMenu";
import ProfileMenu from "~/components/ProfileMenu";
import defaultProfileIcon from "~/assets/default profile icon.jpg";
import VideoPlayer from "~/components/VideoPlayer";

const VideoList: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const { videoId } = router.query as { videoId: string };

  const { data: video, isLoading } = api.video.get.useQuery(
    { videoId },
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.data?.code === "FORBIDDEN") return false;
        else return failureCount < 2;
      },
    }
  );

  if (!isLoading && !video) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <span className="max-w-[80%] text-center text-2xl font-medium">
          This recording is currently unavailable
        </span>
        <span className="mt-3 max-w-[80%] text-center text-sm">
          O link pode ter expirado ou o compartilhamento foi desativado.
        </span>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {video?.title ?? "Snapify | The Open Source Loom Alternative"}
        </title>
        <meta property="og:image" content={video?.thumbnailUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="600" />
        <meta
          name="description"
          content="Share high-quality videos asynchronously and collaborate on your own schedule"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen w-screen flex-col items-center justify-center">
        <div className="flex min-h-[62px] w-full items-center justify-between border-b border-solid border-b-[#E7E9EB] bg-white px-6">
          <Link href="/">
            <span>Snapify</span>
          </Link>
          <div className="flex items-center justify-center">
            {video?.isOwner ? (
              <>
                <VideoMoreMenu video={video} />
                <ShareModal video={video} />
              </>
            ) : null}
            {status === "authenticated" ? (
              <>
                <Link href="/videos">
                  <span className="cursor-pointer rounded border border-[#0000001a] px-2 py-2 text-sm text-[#292d34] hover:bg-[#fafbfc]">
                    My Library
                  </span>
                </Link>
                <div className="ml-4 flex items-center justify-center">
                  <ProfileMenu />
                </div>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-600">
                Agilize IA
              </span>
            )}
          </div>
        </div>
        <div className="flex h-full w-full grow flex-col items-center justify-start overflow-auto bg-[#fbfbfb]">
          <div className="flex max-h-[calc(100vh_-_169px)] w-full justify-center bg-black 2xl:max-h-[1160px]">
            {video?.video_url && (
              <div className="aspect-video h-full">
                <VideoPlayer
                  thumbnailUrl={video.thumbnailUrl}
                  video_url={video.video_url}
                />
              </div>
            )}
          </div>
          <div className="mb-10 mt-4 w-full max-w-[1800px] pl-[24px]">
            <div>
              {video?.title ? (
                <div className="mb-4 flex flex-col">
                  <span className="text-[18px] text-lg font-medium">
                    {video.title}
                  </span>
                  <span className="text-[18px] text-sm text-gray-800">
                    {getTime(video.createdAt)}
                  </span>
                </div>
              ) : (
                <div className="mb-4 flex flex-col">
                  <div className="h-5 w-[300px] animate-pulse rounded bg-slate-200"></div>
                  <div className="mt-2 h-4 w-[50px] animate-pulse rounded bg-slate-200"></div>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-row items-center">
              {!isLoading ? (
                <>
                  <div className="h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={video.user.image ?? defaultProfileIcon}
                      alt="profile icon"
                      width={40}
                      height={40}
                      unoptimized
                    />
                  </div>
                  <span className="ml-3 font-medium">{video.user.name}</span>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 animate-pulse overflow-hidden rounded-full bg-slate-200"></div>
                  <div className="ml-3 h-4 w-[100px] animate-pulse rounded bg-slate-200 font-medium"></div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default VideoList;
