import * as Tooltip from "@radix-ui/react-tooltip";
import {
  FullscreenButton,
  MuteButton,
  PIPButton,
  PlayButton,
  useMediaState,
} from "@vidstack/react";
import {
  Minimize as FullscreenExitIcon,
  Maximize as FullscreenIcon,
  VolumeX as MuteIcon,
  PauseIcon,
  PictureInPictureIcon as PictureInPictureExitIcon,
  PictureInPicture2 as PictureInPictureIcon,
  PlayIcon,
  Volume2 as VolumeHighIcon,
  Volume1 as VolumeLowIcon,
} from "lucide-react";

export interface MediaButtonProps {
  tooltipSide?: Tooltip.TooltipContentProps["side"];
  tooltipAlign?: Tooltip.TooltipContentProps["align"];
  tooltipOffset?: number;
}

export const buttonClass =
  "group ring-media-focus relative inline-flex h-10 w-10 cursor-pointer items-center justify-center outline-none ring-inset transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-signal aria-disabled:hidden";

export const tooltipClass =
  "z-10 bg-navy-900 px-2 py-1 text-xs font-medium text-white parent-data-[open]:hidden";

export function Play({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isPaused = useMediaState("paused");
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <PlayButton className={buttonClass} aria-label={isPaused ? "Reproduzir" : "Pausar"}>
          {isPaused ? (
            <PlayIcon className="h-7 w-7 translate-x-px" />
          ) : (
            <PauseIcon className="h-7 w-7" />
          )}
        </PlayButton>
      </Tooltip.Trigger>
      <Tooltip.Content
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isPaused ? "Reproduzir" : "Pausar"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export function Mute({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const volume = useMediaState("volume"),
    isMuted = useMediaState("muted");
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <MuteButton className={buttonClass} aria-label={isMuted ? "Ativar som" : "Silenciar"}>
          {isMuted || volume == 0 ? (
            <MuteIcon className="h-7 w-7" />
          ) : volume < 0.5 ? (
            <VolumeLowIcon className="h-7 w-7" />
          ) : (
            <VolumeHighIcon className="h-7 w-7" />
          )}
        </MuteButton>
      </Tooltip.Trigger>
      <Tooltip.Content
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isMuted ? "Ativar som" : "Silenciar"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export function PIP({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isActive = useMediaState("pictureInPicture");
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <PIPButton
          className={buttonClass}
          aria-label={isActive ? "Sair da janela flutuante" : "Abrir janela flutuante"}
        >
          {isActive ? (
            <PictureInPictureExitIcon className="h-7 w-7" />
          ) : (
            <PictureInPictureIcon className="h-7 w-7" />
          )}
        </PIPButton>
      </Tooltip.Trigger>
      <Tooltip.Content
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? "Sair da janela flutuante" : "Abrir janela flutuante"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export function Fullscreen({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isActive = useMediaState("fullscreen");
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <FullscreenButton
          className={buttonClass}
          aria-label={isActive ? "Sair da tela cheia" : "Entrar em tela cheia"}
        >
          {isActive ? (
            <FullscreenExitIcon className="h-7 w-7" />
          ) : (
            <FullscreenIcon className="h-7 w-7" />
          )}
        </FullscreenButton>
      </Tooltip.Trigger>
      <Tooltip.Content
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? "Sair da tela cheia" : "Entrar em tela cheia"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
