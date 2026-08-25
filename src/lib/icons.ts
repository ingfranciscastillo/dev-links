import {
	SiDevdotto,
	SiDribbble,
	SiFigma,
	SiGithub,
	SiHashnode,
	SiInstagram,
	SiMedium,
	type IconType as SimpleIconType,
	SiRss,
	SiSoundcloud,
	SiSpotify,
	SiSubstack,
	SiTwitch,
	SiX,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import { LetterIcon } from "@solar-icons/react/linear";
import { Globe as LuGlobe } from "lucide-react";

type IconType = SimpleIconType | typeof LuGlobe;

const map: { pattern: RegExp; icon: IconType }[] = [
	{ pattern: /github\.com/i, icon: SiGithub },
	{ pattern: /(twitter|x)\.com/i, icon: SiX },
	{ pattern: /youtube\.com|youtu\.be/i, icon: SiYoutube },
	{ pattern: /twitch\.tv/i, icon: SiTwitch },
	{ pattern: /instagram\.com/i, icon: SiInstagram },
	{ pattern: /mailto:/i, icon: LetterIcon },
	{ pattern: /dev\.to/i, icon: SiDevdotto },
	{ pattern: /hashnode/i, icon: SiHashnode },
	{ pattern: /medium\.com/i, icon: SiMedium },
	{ pattern: /substack/i, icon: SiSubstack },
	{ pattern: /\.rss$|\/feed/i, icon: SiRss },
	{ pattern: /spotify/i, icon: SiSpotify },
	{ pattern: /soundcloud/i, icon: SiSoundcloud },
	{ pattern: /figma\.com/i, icon: SiFigma },
	{ pattern: /dribbble\.com/i, icon: SiDribbble },
];

export function iconForUrl(url: string): IconType {
	for (const m of map) if (m.pattern.test(url)) return m.icon;
	return LuGlobe;
}

export function domainOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}
