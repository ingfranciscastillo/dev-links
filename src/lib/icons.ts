import {
	SiApplemusic,
	SiBandcamp,
	SiBehance,
	SiBitbucket,
	SiBluesky,
	SiBuymeacoffee,
	SiCaldotcom,
	SiCalendly,
	SiCodeforces,
	SiCodesandbox,
	SiDevdotto,
	SiDevpost,
	SiDiscord,
	SiDocker,
	SiDribbble,
	SiFacebook,
	SiFigma,
	SiFreecodecamp,
	SiGithub,
	SiGitlab,
	SiGooglecalendar,
	SiGumroad,
	SiHackerrank,
	SiHashnode,
	SiHuggingface,
	SiIndiehackers,
	SiInstagram,
	SiKaggle,
	SiKofi,
	SiLeetcode,
	SiLemonsqueezy,
	SiMastodon,
	SiMedium,
	type IconType as SimpleIconType,
	SiNotion,
	SiNpm,
	SiObservable,
	SiOpencollective,
	SiPatreon,
	SiPaypal,
	SiProducthunt,
	SiPypi,
	SiQuora,
	SiReddit,
	SiReplit,
	SiRss,
	SiRust,
	SiSnapchat,
	SiSoundcloud,
	SiSourcehut,
	SiSpotify,
	SiStackblitz,
	SiStackoverflow,
	SiSubstack,
	SiTelegram,
	SiThreads,
	SiTiktok,
	SiTwitch,
	SiVimeo,
	SiWakatime,
	SiWellfound,
	SiWhatsapp,
	SiWordpress,
	SiX,
	SiYcombinator,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import { GlobalIcon, LetterIcon } from "@solar-icons/react/linear";

type IconType = SimpleIconType | typeof GlobalIcon | typeof LetterIcon;

const map: { pattern: RegExp; icon: IconType }[] = [
	// Code hosting
	{ pattern: /github\.com/i, icon: SiGithub },
	{ pattern: /gitlab\.com/i, icon: SiGitlab },
	{ pattern: /bitbucket\.org/i, icon: SiBitbucket },
	{ pattern: /sourcehut\.org|sr\.ht/i, icon: SiSourcehut },

	// Package registries / dev tools
	{ pattern: /npmjs\.com/i, icon: SiNpm },
	{ pattern: /pypi\.org/i, icon: SiPypi },
	{ pattern: /crates\.io/i, icon: SiRust },
	{ pattern: /hub\.docker\.com|docker\.com/i, icon: SiDocker },
	{ pattern: /huggingface\.co/i, icon: SiHuggingface },
	{ pattern: /wakatime\.com/i, icon: SiWakatime },
	{ pattern: /replit\.com/i, icon: SiReplit },
	{ pattern: /codesandbox\.io/i, icon: SiCodesandbox },
	{ pattern: /stackblitz\.com/i, icon: SiStackblitz },
	{ pattern: /observablehq\.com/i, icon: SiObservable },

	// Dev communities / competitive programming
	{ pattern: /stackoverflow\.com/i, icon: SiStackoverflow },
	{ pattern: /leetcode\.com/i, icon: SiLeetcode },
	{ pattern: /hackerrank\.com/i, icon: SiHackerrank },
	{ pattern: /codeforces\.com/i, icon: SiCodeforces },
	{ pattern: /freecodecamp\.org/i, icon: SiFreecodecamp },
	{ pattern: /kaggle\.com/i, icon: SiKaggle },
	{ pattern: /devpost\.com/i, icon: SiDevpost },
	{ pattern: /news\.ycombinator\.com/i, icon: SiYcombinator },
	{ pattern: /indiehackers\.com/i, icon: SiIndiehackers },
	{ pattern: /producthunt\.com/i, icon: SiProducthunt },
	{ pattern: /quora\.com/i, icon: SiQuora },
	{ pattern: /wellfound\.com|angel\.co/i, icon: SiWellfound },

	// Writing / blogging
	{ pattern: /dev\.to/i, icon: SiDevdotto },
	{ pattern: /hashnode/i, icon: SiHashnode },
	{ pattern: /medium\.com/i, icon: SiMedium },
	{ pattern: /substack/i, icon: SiSubstack },
	{ pattern: /wordpress\.com/i, icon: SiWordpress },
	{ pattern: /notion\.(so|site)/i, icon: SiNotion },
	{ pattern: /\.rss$|\/feed/i, icon: SiRss },

	// Design
	{ pattern: /figma\.com/i, icon: SiFigma },
	{ pattern: /dribbble\.com/i, icon: SiDribbble },
	{ pattern: /behance\.net/i, icon: SiBehance },

	// Social
	{ pattern: /(twitter|x)\.com/i, icon: SiX },
	{ pattern: /youtube\.com|youtu\.be/i, icon: SiYoutube },
	{ pattern: /twitch\.tv/i, icon: SiTwitch },
	{ pattern: /instagram\.com/i, icon: SiInstagram },
	{ pattern: /facebook\.com/i, icon: SiFacebook },
	{ pattern: /tiktok\.com/i, icon: SiTiktok },
	{ pattern: /threads\.net/i, icon: SiThreads },
	{ pattern: /snapchat\.com/i, icon: SiSnapchat },
	{ pattern: /reddit\.com/i, icon: SiReddit },
	{ pattern: /discord\.(com|gg)/i, icon: SiDiscord },
	{ pattern: /telegram\.(me|org)|t\.me/i, icon: SiTelegram },
	{ pattern: /whatsapp\.com|wa\.me/i, icon: SiWhatsapp },
	{ pattern: /bsky\.app/i, icon: SiBluesky },
	{ pattern: /mastodon\.\w+/i, icon: SiMastodon },

	// Media
	{ pattern: /spotify/i, icon: SiSpotify },
	{ pattern: /soundcloud/i, icon: SiSoundcloud },
	{ pattern: /vimeo\.com/i, icon: SiVimeo },
	{ pattern: /music\.apple\.com/i, icon: SiApplemusic },
	{ pattern: /bandcamp\.com/i, icon: SiBandcamp },

	// Scheduling
	{ pattern: /cal\.com/i, icon: SiCaldotcom },
	{ pattern: /calendly\.com/i, icon: SiCalendly },
	{ pattern: /calendar\.google\.com/i, icon: SiGooglecalendar },

	// Support / monetization
	{ pattern: /patreon\.com/i, icon: SiPatreon },
	{ pattern: /ko-fi\.com/i, icon: SiKofi },
	{ pattern: /buymeacoffee\.com/i, icon: SiBuymeacoffee },
	{ pattern: /paypal\.(com|me)/i, icon: SiPaypal },
	{ pattern: /opencollective\.com/i, icon: SiOpencollective },
	{ pattern: /gumroad\.com/i, icon: SiGumroad },
	{ pattern: /lemonsqueezy\.com/i, icon: SiLemonsqueezy },

	{ pattern: /mailto:/i, icon: LetterIcon },
];

export function iconForUrl(url: string): IconType {
	for (const m of map) if (m.pattern.test(url)) return m.icon;
	return GlobalIcon;
}

export function domainOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}
